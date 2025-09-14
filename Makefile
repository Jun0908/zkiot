# ===== Root Makefile (simple) =====
NODE_PM ?= npm
BUN ?= bun

FRONT_APPS := Frontend/Frontend-app Frontend/frontend-intro
ELIZA := Frontend/eliza-os
SERVERS := Servers/nft-mcp-server Servers/zk-mcp-server

.PHONY: install dev dev-eliza dev-servers

## install: 全部の依存関係をインストール
install:
	@for d in $(FRONT_APPS) $(SERVERS); do \
		echo "==> Installing $$d"; \
		cd $$d && $(NODE_PM) install; \
	done
	@echo "==> Installing ElizaOS with bun"
	@cd $(ELIZA) && $(BUN) install

## dev: フロントエンド (Frontend-app + frontend-intro) を起動
dev:
	@pids=""; \
	for d in $(FRONT_APPS); do \
		echo "==> Starting dev in $$d"; \
		( cd $$d && $(NODE_PM) run dev ) & pids="$$pids $$!"; \
	done; \
	trap 'kill -TERM $$pids 2>/dev/null || true' INT TERM; \
	wait

## dev-eliza: ElizaOS を bun で起動
dev-eliza:
	@cd $(ELIZA) && $(BUN) run dev

## dev-servers: サーバ2つを並列起動
dev-servers:
	@pids=""; \
	for d in $(SERVERS); do \
		echo "==> Starting dev in $$d"; \
		( cd $$d && $(NODE_PM) run dev ) & pids="$$pids $$!"; \
	done; \
	trap 'kill -TERM $$pids 2>/dev/null || true' INT TERM; \
	wait
