DIST := dist/pomodoro-tdah/browser
WWW  := www
SOUNDS := resources/sounds
IOS_ICON := ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
ANDROID_RAW := android/app/src/main/res/raw
NODE_TS := node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON

.DEFAULT_GOAL := help
.PHONY: help install dev build watch test sync sounds icon clean ios android open-ios open-android

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances
	npm install

dev: ## Lance le serveur de dev (http://localhost:4200)
	npx ng serve --open

build: ## Build de production
	npx ng build

watch: ## Build en mode watch (développement)
	npx ng build --watch --configuration development

test: ## Lance les tests
	npx ng test

sync: build ## Build puis copie dans www/ et synchronise Capacitor
	rm -rf $(WWW)
	mkdir -p $(WWW)
	cp -r $(DIST)/. $(WWW)/
	npx cap sync
	@$(MAKE) --no-print-directory sounds

sounds: ## Génère les sons de notification (WAV) et les copie dans Android
	$(NODE_TS) scripts/generate-sounds.ts $(SOUNDS)
	@if [ -d android ]; then mkdir -p $(ANDROID_RAW) && cp $(SOUNDS)/*.wav $(ANDROID_RAW)/ && echo "✓ sons copiés dans $(ANDROID_RAW)"; fi

icon: ## Génère l'icône iOS (1024 px, sans transparence) depuis resources/app-icon.svg
	@tmp=$$(mktemp -d) && \
	qlmanage -t -s 1024 -o $$tmp resources/app-icon.svg >/dev/null && \
	sips -s format jpeg -s formatOptions best $$tmp/app-icon.svg.png --out $$tmp/icon.jpg >/dev/null && \
	sips -s format png $$tmp/icon.jpg --out $(IOS_ICON) >/dev/null && \
	rm -rf $$tmp && echo "✓ $(IOS_ICON)"

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
