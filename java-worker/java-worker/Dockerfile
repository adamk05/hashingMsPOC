FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

COPY pom.xml ./
RUN mvn dependency:go-offline

COPY src ./src

RUN mvn clean package

FROM eclipse-temurin:17-jre-alpine

WORKDIR /java-worker

COPY --from=builder /build/target/*-jar-with-dependencies.jar worker.jar

CMD ["java", "-jar", "worker.jar"]