DIST := dist/pomodoro-tdah/browser
WWW  := www
SOUNDS := resources/sounds
ANDROID_RAW := android/app/src/main/res/raw
NODE_TS := node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON

.DEFAULT_GOAL := help
.PHONY: help install dev build watch test test-a11y sync sounds icons clean ios android open-ios open-android

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances
	npm install

dev: ## Lance le serveur de dev (http://localhost:4200)
	npx ng serve --open

build: ## Build de production
	npx ng build

watch: ## Build en mode watch (développement)
	npx ng build --watch --configuration development

test: ## Lance les tests unitaires
	npx ng test

test-a11y: ## Lance les tests d'accessibilité (axe-core + clavier)
	npx playwright test

sync: build ## Build puis copie dans www/ et synchronise Capacitor
	rm -rf $(WWW)
	mkdir -p $(WWW)
	cp -r $(DIST)/. $(WWW)/
	npx cap sync
	@$(MAKE) --no-print-directory sounds

sounds: ## Génère les sons de notification (WAV) et les copie dans Android
	$(NODE_TS) scripts/generate-sounds.ts $(SOUNDS)
	@if [ -d android ]; then mkdir -p $(ANDROID_RAW) && cp $(SOUNDS)/*.wav $(ANDROID_RAW)/ && echo "✓ sons copiés dans $(ANDROID_RAW)"; fi

icons: ## Génère icônes et écrans de lancement (iOS, Android, web) depuis resources/*.svg
	$(NODE_TS) scripts/generate-icons.ts

ios: ## Ajoute la plateforme iOS (une seule fois)
	npx cap add ios

android: ## Ajoute la plateforme Android (une seule fois)
	npx cap add android

open-ios: sync ## Build, sync et ouvre Xcode
	npx cap open ios

open-android: sync ## Build, sync et ouvre Android Studio
	npx cap open android

clean: ## Supprime les artefacts de build
	rm -rf dist $(WWW) .angular/cache
