# ==========================================
# Urban Nest Backend — Production Dockerfile
# Multi-stage: Maven 3.9 / Temurin 17 -> Temurin JRE 17
# ==========================================

# Stage 1: Build Application
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build executable JAR skipping tests for speed
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Production Runtime
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Create a non-root application user for MNC security compliance
RUN groupadd -r spring && useradd -r -g spring spring

# Copy compiled JAR from build stage
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar

# Switch to unprivileged user
USER spring:spring

# Expose backend port
EXPOSE 8083

# JVM memory management optimized for container environments
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
