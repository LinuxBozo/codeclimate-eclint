# Code Climage ECLint engine
[![CircleCI](https://circleci.com/gh/LinuxBozo/codeclimate-eclint.svg?style=svg)](https://circleci.com/gh/LinuxBozo/codeclimate-eclint)
[![Code Climate](https://codeclimate.com/github/LinuxBozo/codeclimate-eclint/badges/gpa.svg)](https://codeclimate.com/github/LinuxBozo/codeclimate-eclint)
[![Test Coverage](https://codeclimate.com/github/LinuxBozo/codeclimate-eclint/badges/coverage.svg)](https://codeclimate.com/github/LinuxBozo/codeclimate-eclint/coverage)
[![Issue Count](https://codeclimate.com/github/LinuxBozo/codeclimate-eclint/badges/issue_count.svg)](https://codeclimate.com/github/LinuxBozo/codeclimate-eclint)

`codeclimate-eclint` is a Code Climate engine that wraps [ECLint][].

ECLint is a tool for validating or fixing code that doesn't adhere to settings defined in `.editorconfig`. It also infers settings from existing code. See the [EditorConfig Project](http://editorconfig.org/) for details about the `.editorconfig` file.

### Installation

1. If you haven't already, [install the Code Climate CLI][CLI]

2. Run `codeclimate engines:enable eclint`. This command both installs the engine and enables it in your `.codeclimate.yml` file

3. You're ready to analyze! Browse into your project's folder and run `codeclimate analyze`

### Need help?

If you're running into a Code Climate issue, first look over this project's [GitHub Issues](https://github.com/linuxbozo/codeclimate-eclint/issues), as your question may have already been covered.

[CLI]: https://github.com/codeclimate/codeclimate
[ECLint]: https://github.com/jedmao/eclint
