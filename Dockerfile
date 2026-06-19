FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests


FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S spring \
    && adduser -S spring -G spring

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /uploads \
    && chown -R spring:spring /app /uploads

USER spring:spring

EXPOSE 10000

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]