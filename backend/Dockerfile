FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/nurai-backend-1.0.0.jar app.jar
EXPOSE 8082
ENV PORT=8082
CMD ["java", "-Xmx256m", "-Xss512k", "-jar", "app.jar"]
