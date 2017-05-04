.PHONY: image

IMAGE_NAME ?= codeclimate/codeclimate-eclint

image:
	docker build --rm -t $(IMAGE_NAME) .
