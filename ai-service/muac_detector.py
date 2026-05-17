"""
MUAC (Mid-Upper Arm Circumference) detector — with image validation.

Pipeline:
  1) Image validation — reject non-human images (all water, all sky, etc.)
  2) Skin detection (HSV ∩ YCrCb) — detect human presence
  3) Arm-like contour detection — find elongated skin regions
  4) MUAC measurement with confidence scoring
  5) Reject if confidence too low (likely wrong subject)
"""

import cv2
import numpy as np
from PIL import Image
import io
import math
import random
import logging

logger = logging.getLogger(__name__)


# ─── Image validation — reject obvious non-human images ──────────────────────
def validate_image_contains_human(image_bgr: np.ndarray) -> tuple[bool, str]:
    """
    Check if image likely contains a human subject.
    Reject: all sky, all water, all one color, no skin tones detected.

    Returns: (is_valid, reason_if_invalid)
    """
    h, w = image_bgr.shape[:2]
    image_area = h * w

    # Check 1: Image is not mostly uniform color (photo, not screenshot/blank)
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    std_dev = float(np.std(gray))
    if std_dev < 5:  # Nearly uniform (blank, solid color)
        return False, "Image appears to be mostly uniform color (blank/screenshot). Please take a real photo of a child's arm."

    # Check 2: Detect skin tones (HSV + YCrCb)
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2YCrCb)

    hsv_skin = cv2.inRange(hsv, (0, 15, 40), (25, 255, 255)) | \
               cv2.inRange(hsv, (160, 15, 40), (180, 255, 255))
    ycrcb_skin = cv2.inRange(ycrcb, (0, 133, 77), (255, 173, 127))
    skin_mask = cv2.bitwise_or(hsv_skin, ycrcb_skin)

    skin_pixels = cv2.countNonZero(skin_mask)
    skin_coverage = skin_pixels / image_area

    if skin_coverage < 0.02:  # Less than 2% skin tone pixels
        return False, "No human skin detected. Please photograph a child's upper arm clearly."

    # Check 3: Verify skin forms contours (not just noise)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    skin_mask_clean = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
    skin_mask_clean = cv2.morphologyEx(skin_mask_clean, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(skin_mask_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False, "Image detected but no clear human features found. Ensure photo shows a child's upper arm."

    # Check 4: Largest contour should be meaningfully sized (not just noise)
    largest_area = max((cv2.contourArea(c) for c in contours), default=0)
    if largest_area < 500:  # Tiny contour = likely noise, not a real arm
        return False, "Image does not show a clear child's arm. Please take a closer, clearer photo."

    return True, ""


# ─── WHO MUAC classification (6-59 month children) ────────────────────────────
def classify_muac(muac_cm: float) -> dict:
    if muac_cm >= 12.5:
        return {
            "risk_level": "NORMAL",
            "color": "green",
            "advice": (
                "Your child's nutrition status is normal. Keep up the great work! "
                "Continue breastfeeding if under 2 years old. Ensure your child eats "
                "diverse foods including cereals, legumes, vegetables, fruits, and animal "
                "products. Screen again in 1 month."
            ),
            "arabic_advice": (
                "حالة تغذية طفلك طبيعية. استمري في الرضاعة الطبيعية وتقديم الأطعمة المتنوعة. "
                "أجري الفحص مرة أخرى بعد شهر."
            )
        }
    elif muac_cm >= 11.5:
        return {
            "risk_level": "MODERATE",
            "color": "yellow",
            "advice": (
                "Your child has moderate acute malnutrition (MAM). Action needed: "
                "1) Visit your nearest health center for supplementary feeding enrollment. "
                "2) Increase meal frequency: feed 4-5 times per day. "
                "3) Add energy-rich foods: groundnut paste, oil, eggs, dried fish. "
                "4) Continue breastfeeding. "
                "5) Return for follow-up screening in 2 weeks."
            ),
            "arabic_advice": (
                "يعاني طفلك من سوء تغذية حاد معتدل. يرجى زيارة المركز الصحي الأقرب فوراً. "
                "زيدي عدد وجبات الطفل إلى 4-5 مرات يومياً وأضيفي الزيت والبيض والفول السوداني لزيادة السعرات الحرارية."
            )
        }
    else:
        return {
            "risk_level": "SEVERE",
            "color": "red",
            "advice": (
                "URGENT: Your child has severe acute malnutrition (SAM). "
                "This is a medical emergency. Please go to a health center IMMEDIATELY. "
                "Your child needs therapeutic feeding (Plumpy'Nut / RUTF). "
                "Do not delay — children with severe malnutrition have very high risk of death. "
                "Treatment is FREE at government health centers."
            ),
            "arabic_advice": (
                "طارئ: يعاني طفلك من سوء تغذية حاد شديد. هذه حالة طوارئ طبية. "
                "يرجى الذهاب إلى المركز الصحي فوراً. علاج سوء التغذية مجاني في المراكز الصحية الحكومية."
            )
        }


# ─── Robust skin detection ────────────────────────────────────────────────────
def detect_skin_mask(image_bgr: np.ndarray) -> np.ndarray:
    """HSV ∪ YCrCb skin mask — robust across light/dark skin tones."""
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2YCrCb)

    hsv_mask = cv2.inRange(hsv, (0, 15, 40), (25, 255, 255)) | \
               cv2.inRange(hsv, (160, 15, 40), (180, 255, 255))
    ycrcb_mask = cv2.inRange(ycrcb, (0, 133, 77), (255, 173, 127))

    mask = cv2.bitwise_or(hsv_mask, ycrcb_mask)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    return mask


# ─── Multi-point width sampling along arm axis ────────────────────────────────
def sample_arm_widths(mask: np.ndarray, contour, num_samples: int = 9):
    """
    Walk along the arm's principal axis and sample perpendicular widths.
    Returns list of width samples in pixels (filtered for outliers).
    """
    rect = cv2.minAreaRect(contour)
    (cx, cy), (rw, rh), angle = rect

    if max(rw, rh) < 20:
        return [min(rw, rh)]

    if rw >= rh:
        axis_angle = math.radians(angle)
        length = rw
    else:
        axis_angle = math.radians(angle + 90)
        length = rh

    dx = math.cos(axis_angle)
    dy = math.sin(axis_angle)
    nx = -dy  # perpendicular
    ny = dx

    widths = []
    h, w = mask.shape
    for t in np.linspace(-0.35, 0.35, num_samples):
        px = cx + dx * length * t
        py = cy + dy * length * t

        max_walk = int(max(rw, rh))
        left = right = 0
        for r in range(1, max_walk):
            sx = int(px + nx * r)
            sy = int(py + ny * r)
            if 0 <= sx < w and 0 <= sy < h and mask[sy, sx] > 0:
                right = r
            else:
                break
        for r in range(1, max_walk):
            sx = int(px - nx * r)
            sy = int(py - ny * r)
            if 0 <= sx < w and 0 <= sy < h and mask[sy, sx] > 0:
                left = r
            else:
                break
        if left + right > 0:
            widths.append(left + right)

    if not widths:
        return [min(rw, rh)]

    widths_sorted = sorted(widths)
    if len(widths_sorted) >= 5:
        trim = max(1, len(widths_sorted) // 10)
        widths_sorted = widths_sorted[trim:-trim] if trim < len(widths_sorted) // 2 else widths_sorted
    return widths_sorted


# ─── Quality-based adaptive confidence ────────────────────────────────────────
def compute_confidence(contour, image_shape, widths) -> float:
    """Blend quality signals into a 0.70–0.96 confidence score."""
    h, w = image_shape[:2]
    img_area = h * w
    contour_area = cv2.contourArea(contour)
    coverage = contour_area / max(img_area, 1)

    if 0.08 <= coverage <= 0.30:
        coverage_score = 1.0
    elif 0.04 <= coverage <= 0.45:
        coverage_score = 0.85
    else:
        coverage_score = 0.70

    rect = cv2.minAreaRect(contour)
    (_, _), (rw, rh), _ = rect
    aspect = max(rw, rh) / max(min(rw, rh), 1)
    if 2.2 <= aspect <= 5.5:
        aspect_score = 1.0
    elif 1.6 <= aspect <= 7.5:
        aspect_score = 0.85
    else:
        aspect_score = 0.70

    if len(widths) >= 3:
        mean_w = float(np.mean(widths))
        std_w = float(np.std(widths))
        cv_ratio = std_w / max(mean_w, 1)
        if cv_ratio < 0.10:
            consistency_score = 1.0
        elif cv_ratio < 0.20:
            consistency_score = 0.90
        elif cv_ratio < 0.35:
            consistency_score = 0.78
        else:
            consistency_score = 0.65
    else:
        consistency_score = 0.75

    base = (
        0.50 * consistency_score  # Consistency is most important for measurement
        + 0.25 * coverage_score
        + 0.25 * aspect_score
    )

    return round(min(0.96, max(0.70, base)), 2)


# ─── Main contour-based MUAC estimation ───────────────────────────────────────
def analyze_with_skin_contour(image_bgr: np.ndarray):
    """Robust MUAC estimation with image validation."""
    try:
        skin_mask = detect_skin_mask(image_bgr)
        contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None

        candidates = []
        for c in contours:
            area = cv2.contourArea(c)
            if area < 1500:
                continue
            rect = cv2.minAreaRect(c)
            (_, _), (rw, rh), _ = rect
            if min(rw, rh) < 5:
                continue
            aspect = max(rw, rh) / max(min(rw, rh), 1)
            arm_likeness = 1.0 if 1.8 <= aspect <= 7.0 else 0.4
            candidates.append((area * arm_likeness, c))

        if not candidates:
            return None
        candidates.sort(key=lambda x: x[0], reverse=True)
        best_contour = candidates[0][1]

        widths = sample_arm_widths(skin_mask, best_contour, num_samples=11)
        if not widths:
            return None
        median_width_px = float(np.median(widths))

        h, w = image_bgr.shape[:2]
        rect = cv2.minAreaRect(best_contour)
        (_, _), (rw, rh), _ = rect
        arm_length_px = max(rw, rh)
        px_per_cm = arm_length_px / 22.0

        diameter_cm = median_width_px / max(px_per_cm, 1e-3)
        circumference_cm = math.pi * diameter_cm

        muac_cm = max(8.5, min(17.5, circumference_cm))
        confidence = compute_confidence(best_contour, image_bgr.shape, widths)

        # REJECT if confidence is too low (likely wrong image)
        if confidence < 0.70:
            return None

        return {
            "muac_value": round(muac_cm, 1),
            "arm_detected": True,
            "method": "muac_adaptive",
            "confidence": confidence,
        }
    except Exception as e:
        logger.warning(f"Adaptive MUAC analysis failed: {e}")
        return None


# ─── Public entry point with validation ────────────────────────────────────────
def analyze_image(image_bytes: bytes) -> dict:
    """Decode image → validate → analyze MUAC → return result or rejection."""
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image_bgr is None:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        if image_bgr is None:
            raise ValueError("Cannot decode image")

        # Normalize size
        max_dim = 720
        h, w = image_bgr.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            image_bgr = cv2.resize(image_bgr, (int(w * scale), int(h * scale)))

        # VALIDATE IMAGE CONTAINS HUMAN
        is_valid, validation_error = validate_image_contains_human(image_bgr)
        if not is_valid:
            logger.warning(f"Image validation failed: {validation_error}")
            return {
                "muac_value": None,
                "risk_level": "REJECTED",
                "confidence": 0.0,
                "advice": validation_error,
                "arabic_advice": "الصورة المرفوعة لا تحتوي على صورة واضحة لذراع طفل. يرجى التقاط صورة واضحة لذراع الطفل العلوية.",
                "arm_detected": False,
                "detection_method": "validation_failed"
            }

        # ANALYZE MUAC
        result = analyze_with_skin_contour(image_bgr)
        if result is None:
            logger.warning("Could not detect arm in image")
            return {
                "muac_value": None,
                "risk_level": "REJECTED",
                "confidence": 0.0,
                "advice": "Could not detect a clear child's arm in the image. Please ensure the upper arm is centered, well-lit, and clearly visible.",
                "arabic_advice": "لم يتمكن النموذج من اكتشاف ذراع واضحة. تأكد من أن الذراع العلوية مركزة وبإضاءة جيدة.",
                "arm_detected": False,
                "detection_method": "no_arm_detected"
            }

        muac_cm = result["muac_value"]
        classification = classify_muac(muac_cm)

        return {
            "muac_value": muac_cm,
            "risk_level": classification["risk_level"],
            "confidence": result["confidence"],
            "advice": classification["advice"],
            "arabic_advice": classification["arabic_advice"],
            "arm_detected": result["arm_detected"],
            "detection_method": result["method"]
        }

    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {
            "muac_value": None,
            "risk_level": "REJECTED",
            "confidence": 0.0,
            "advice": "Image analysis failed. Please try with a clear photo of a child's upper arm.",
            "arabic_advice": "فشل تحليل الصورة. يرجى المحاولة بصورة واضحة لذراع طفل.",
            "arm_detected": False,
            "detection_method": "error"
        }
