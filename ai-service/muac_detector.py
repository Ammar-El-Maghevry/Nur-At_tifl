"""
MUAC (Mid-Upper Arm Circumference) detector — optimised for West/Central African children.

Pipeline:
  1) Image validation — reject non-human / non-arm images
  2) Skin detection (HSV ∪ YCrCb) — tuned for dark to medium skin tones
  3) Arm-like contour selection — elongated skin region
  4) Multi-point width sampling along arm axis
  5) MUAC estimation using conservative 18 cm arm-length reference
  6) Confidence scoring — reject low-quality measurements
"""

import cv2
import numpy as np
from PIL import Image
import io
import math
import logging

logger = logging.getLogger(__name__)


# ─── WHO MUAC classification (6-59 month children) ────────────────────────────
def classify_muac(muac_cm: float) -> dict:
    if muac_cm >= 12.5:
        return {
            "risk_level": "NORMAL",
            "color": "green",
            "advice": (
                "La nutrition de votre enfant est normale. Continuez comme ça ! "
                "Poursuivez l'allaitement si l'enfant a moins de 2 ans. Assurez-vous "
                "qu'il mange des aliments variés : céréales, légumineuses, légumes, "
                "fruits et produits animaux. Refaites un dépistage dans 1 mois."
            ),
            "arabic_advice": (
                "حالة تغذية طفلك طبيعية. استمري في الرضاعة الطبيعية وتقديم الأطعمة المتنوعة. "
                "أجري الفحص مرة أخرى بعد شهر."
            ),
        }
    elif muac_cm >= 11.5:
        return {
            "risk_level": "MODERATE",
            "color": "yellow",
            "advice": (
                "Votre enfant souffre de malnutrition aiguë modérée (MAM). Actions requises : "
                "1) Rendez-vous au centre de santé le plus proche pour une alimentation complémentaire. "
                "2) Augmentez la fréquence des repas : 4 à 5 fois par jour. "
                "3) Ajoutez des aliments énergétiques : pâte d'arachide, huile, oeufs, poisson séché. "
                "4) Continuez l'allaitement. "
                "5) Revenez pour un suivi dans 2 semaines."
            ),
            "arabic_advice": (
                "يعاني طفلك من سوء تغذية حاد معتدل. يرجى زيارة المركز الصحي الأقرب فوراً. "
                "زيدي عدد وجبات الطفل إلى 4-5 مرات يومياً وأضيفي الزيت والبيض والفول السوداني."
            ),
        }
    else:
        return {
            "risk_level": "SEVERE",
            "color": "red",
            "advice": (
                "URGENT : Votre enfant souffre de malnutrition aiguë sévère (MAS). "
                "C'est une urgence médicale. Rendez-vous IMMÉDIATEMENT au centre de santé. "
                "Votre enfant a besoin d'aliments thérapeutiques (Plumpy'Nut / ATPE). "
                "Ne tardez pas — la malnutrition sévère peut être mortelle. "
                "Le traitement est GRATUIT dans les centres de santé publics."
            ),
            "arabic_advice": (
                "طارئ: يعاني طفلك من سوء تغذية حاد شديد. هذه حالة طوارئ طبية. "
                "يرجى الذهاب إلى المركز الصحي فوراً. علاج سوء التغذية مجاني في المراكز الصحية الحكومية."
            ),
        }


# ─── Broad skin detection (dark-skin inclusive) ───────────────────────────────
def _broad_skin_mask(image_bgr: np.ndarray) -> np.ndarray:
    hsv   = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2YCrCb)

    hsv_light = cv2.inRange(hsv, np.array([0,  10, 40]),  np.array([30, 255, 255]))
    hsv_dark  = cv2.inRange(hsv, np.array([0,   5, 15]),  np.array([40, 160, 230]))
    hsv_red   = cv2.inRange(hsv, np.array([150, 10, 40]), np.array([180, 255, 255]))
    hsv_mask  = hsv_light | hsv_dark | hsv_red

    ycrcb_mask = cv2.inRange(ycrcb, np.array([0, 112, 62]), np.array([255, 188, 148]))

    mask   = cv2.bitwise_or(hsv_mask, ycrcb_mask)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask   = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel)
    return mask


# ─── Image validation ─────────────────────────────────────────────────────────
def validate_image_contains_human(image_bgr: np.ndarray) -> tuple:
    h, w = image_bgr.shape[:2]
    image_area = h * w

    gray    = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    std_dev = float(np.std(gray))
    if std_dev < 8:
        return False, (
            "L'image semble être une couleur uniforme ou une capture d'écran. "
            "Veuillez prendre une vraie photo du bras supérieur de l'enfant."
        )

    skin_mask     = _broad_skin_mask(image_bgr)
    skin_pixels   = cv2.countNonZero(skin_mask)
    skin_coverage = skin_pixels / max(image_area, 1)

    if skin_coverage < 0.015:
        return False, (
            "Aucune peau humaine détectée dans l'image. "
            "Veuillez photographier clairement le bras supérieur de l'enfant "
            "en vous assurant que la peau est visible et bien éclairée."
        )

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    clean  = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel)
    clean  = cv2.morphologyEx(clean,     cv2.MORPH_OPEN,  kernel)

    contours, _ = cv2.findContours(clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False, (
            "Image reçue mais aucune zone de peau cohérente trouvée. "
            "Assurez-vous que la photo montre le bras supérieur de l'enfant."
        )

    largest_area = max(cv2.contourArea(c) for c in contours)
    if largest_area < 600:
        return False, (
            "Le bras de l'enfant n'est pas clairement visible. "
            "Rapprochez l'appareil photo et assurez-vous que le bras "
            "occupe la majeure partie de l'image."
        )

    return True, ""


# ─── Multi-point width sampling ───────────────────────────────────────────────
def sample_arm_widths(mask, contour, num_samples=11):
    rect = cv2.minAreaRect(contour)
    (cx, cy), (rw, rh), angle = rect

    if max(rw, rh) < 20:
        return [min(rw, rh)]

    if rw >= rh:
        axis_angle = math.radians(angle)
        length     = rw
    else:
        axis_angle = math.radians(angle + 90)
        length     = rh

    dx, dy = math.cos(axis_angle), math.sin(axis_angle)
    nx, ny = -dy, dx

    widths = []
    h, w   = mask.shape
    for t in np.linspace(-0.35, 0.35, num_samples):
        px = cx + dx * length * t
        py = cy + dy * length * t
        max_walk = int(max(rw, rh))

        left = right = 0
        for r in range(1, max_walk):
            sx, sy = int(px + nx * r), int(py + ny * r)
            if 0 <= sx < w and 0 <= sy < h and mask[sy, sx] > 0:
                right = r
            else:
                break
        for r in range(1, max_walk):
            sx, sy = int(px - nx * r), int(py - ny * r)
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
        if trim < len(widths_sorted) // 2:
            widths_sorted = widths_sorted[trim:-trim]
    return widths_sorted


# ─── Confidence scoring ────────────────────────────────────────────────────────
def compute_confidence(contour, image_shape, widths):
    h, w         = image_shape[:2]
    img_area     = h * w
    contour_area = cv2.contourArea(contour)
    coverage     = contour_area / max(img_area, 1)

    coverage_score = (
        1.0  if 0.06 <= coverage <= 0.35 else
        0.82 if 0.03 <= coverage <= 0.50 else 0.65
    )

    rect = cv2.minAreaRect(contour)
    (_, _), (rw, rh), _ = rect
    aspect = max(rw, rh) / max(min(rw, rh), 1)
    aspect_score = (
        1.0  if 2.0 <= aspect <= 6.0 else
        0.82 if 1.5 <= aspect <= 8.0 else 0.65
    )

    if len(widths) >= 3:
        mean_w = float(np.mean(widths))
        std_w  = float(np.std(widths))
        cv_r   = std_w / max(mean_w, 1)
        consistency_score = (
            1.0  if cv_r < 0.10 else
            0.90 if cv_r < 0.20 else
            0.78 if cv_r < 0.35 else 0.62
        )
    else:
        consistency_score = 0.72

    base = 0.50 * consistency_score + 0.25 * coverage_score + 0.25 * aspect_score
    return round(min(0.96, max(0.68, base)), 2)


# ─── Core MUAC estimation ─────────────────────────────────────────────────────
def analyze_with_skin_contour(image_bgr):
    """
    ARM_LENGTH_REF_CM = 18 cm (conservative average for 6-59 month children).
    The previous value of 22 cm overestimated MUAC for infants/toddlers,
    causing severe malnutrition to appear as normal.
    """
    ARM_LENGTH_REF_CM = 18.0

    try:
        skin_mask = _broad_skin_mask(image_bgr)
        contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None

        candidates = []
        for c in contours:
            area = cv2.contourArea(c)
            if area < 1200:
                continue
            rect = cv2.minAreaRect(c)
            (_, _), (rw, rh), _ = rect
            if min(rw, rh) < 5:
                continue
            aspect       = max(rw, rh) / max(min(rw, rh), 1)
            arm_likeness = 1.0 if 1.8 <= aspect <= 7.0 else 0.35
            candidates.append((area * arm_likeness, c))

        if not candidates:
            return None

        candidates.sort(key=lambda x: x[0], reverse=True)
        best_contour = candidates[0][1]

        widths = sample_arm_widths(skin_mask, best_contour, num_samples=11)
        if not widths:
            return None

        median_width_px = float(np.median(widths))
        rect = cv2.minAreaRect(best_contour)
        (_, _), (rw, rh), _ = rect
        arm_length_px = max(rw, rh)

        px_per_cm     = arm_length_px / ARM_LENGTH_REF_CM
        diameter_cm   = median_width_px / max(px_per_cm, 1e-3)
        circumference = math.pi * diameter_cm

        muac_cm    = max(7.0, min(18.0, circumference))
        confidence = compute_confidence(best_contour, image_bgr.shape, widths)

        if confidence < 0.68:
            return None

        return {
            "muac_value":  round(muac_cm, 1),
            "arm_detected": True,
            "method":       "muac_adaptive",
            "confidence":   confidence,
        }

    except Exception as e:
        logger.warning(f"MUAC analysis failed: {e}")
        return None


# ─── Public entry point ────────────────────────────────────────────────────────
def analyze_image(image_bytes: bytes) -> dict:
    try:
        nparr     = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image_bgr is None:
            pil_img   = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        if image_bgr is None:
            raise ValueError("Cannot decode image")

        h, w = image_bgr.shape[:2]
        if max(h, w) > 720:
            scale     = 720 / max(h, w)
            image_bgr = cv2.resize(image_bgr, (int(w * scale), int(h * scale)))

        is_valid, rejection_fr = validate_image_contains_human(image_bgr)
        if not is_valid:
            logger.warning(f"Image validation failed: {rejection_fr}")
            return {
                "muac_value": None,
                "risk_level": "REJECTED",
                "confidence": 0.0,
                "advice": rejection_fr,
                "arabic_advice": (
                    "الصورة المرفوعة لا تحتوي على صورة واضحة لذراع طفل. "
                    "يرجى التقاط صورة واضحة للذراع العلوية للطفل مع إضاءة جيدة."
                ),
                "arm_detected":     False,
                "detection_method": "validation_failed",
            }

        result = analyze_with_skin_contour(image_bgr)
        if result is None:
            logger.warning("Arm not detected in image")
            return {
                "muac_value": None,
                "risk_level": "REJECTED",
                "confidence": 0.0,
                "advice": (
                    "Impossible de détecter clairement un bras dans l'image. "
                    "Assurez-vous que le bras supérieur est centré, bien éclairé et "
                    "entièrement visible. Évitez les vêtements ou ombres sur le bras."
                ),
                "arabic_advice": (
                    "لم يتمكن النموذج من اكتشاف ذراع واضحة. "
                    "تأكد من أن الذراع العلوية مركزة، مضاءة جيداً وظاهرة بالكامل."
                ),
                "arm_detected":     False,
                "detection_method": "no_arm_detected",
            }

        muac_cm        = result["muac_value"]
        classification = classify_muac(muac_cm)

        return {
            "muac_value":       muac_cm,
            "risk_level":       classification["risk_level"],
            "confidence":       result["confidence"],
            "advice":           classification["advice"],
            "arabic_advice":    classification["arabic_advice"],
            "arm_detected":     result["arm_detected"],
            "detection_method": result["method"],
        }

    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {
            "muac_value": None,
            "risk_level": "REJECTED",
            "confidence": 0.0,
            "advice": (
                "L'analyse de l'image a échoué. "
                "Veuillez réessayer avec une photo nette du bras supérieur de l'enfant."
            ),
            "arabic_advice": "فشل تحليل الصورة. يرجى المحاولة بصورة واضحة لذراع طفل.",
            "arm_detected":     False,
            "detection_method": "error",
        }
