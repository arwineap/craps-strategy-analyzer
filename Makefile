.PHONY: dev build preview install clean typecheck

install:
	npm install

dev: install
	npm run dev

build: install
	npm run build

preview: build
	npm run preview

typecheck:
	npm run typecheck

clean:
	rm -rf dist node_modules/.vite
