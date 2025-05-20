fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios test

```sh
[bundle exec] fastlane ios test
```

Run UI Tests

### ios browserstack

```sh
[bundle exec] fastlane ios browserstack
```

Submit to BrowserStack

### ios browserstack_test

```sh
[bundle exec] fastlane ios browserstack_test
```

Run tests on BrowserStack

### ios browserstack_build_and_test

```sh
[bundle exec] fastlane ios browserstack_build_and_test
```

Build and test on BrowserStack

### ios setup_profiles

```sh
[bundle exec] fastlane ios setup_profiles
```

Setup provisioning profiles for development

### ios build_dev

```sh
[bundle exec] fastlane ios build_dev
```

Build the app for development

### ios build_dev_alt

```sh
[bundle exec] fastlane ios build_dev_alt
```

Build the app for development using export options

### ios build_manual

```sh
[bundle exec] fastlane ios build_manual
```

Build the app with manual signing

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
