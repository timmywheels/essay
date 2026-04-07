BIN := essay
GOBIN := $(shell go env GOPATH)/bin

.PHONY: build install

build:
	go build -o $(BIN) .

install:
	go build -o $(GOBIN)/$(BIN) .
