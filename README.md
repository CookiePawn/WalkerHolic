# WalkerHolic

> 만보기 어플
> 
> 하루 만보를 채울 경우 탑 층수 올라가는 기능

# MEMBER

홍유빈 - 기획 
[GitHub](https://github.com/binihaus)
  
안준철 - 개발
[GitHub](https://github.com/CookiePawn)


# Project Period

    Main WEB DEV. 2025.05.27 ~
    [2025.05.27]Google Fitness API 연동
    


## USING
> https://github.com/CookiePawn/template-cli.git
>
> Google Cloud Console - Google Fitness API


## Version
> ## v0.0.1
> [2025-04-09]
>
> Create Main Web
>
> Create Legal Quiz(법률 퀴즈)


## React Native Cli 탬플릿
> 프로젝트명 변경 가능
>
> https://development-piece.tistory.com/462?category=1222088


## Project Start
```bash
npx @react-native-community/cli templatecli --version 0.77.0
```


## ENV 분기

[android]
> android/app/build.gradle 참조
> 
> android/settings.gradle 참조

[IOS]
> https://velog.io/@2ast/React-Native-개발용-Dev-앱-분리하기-ios
> 
> https://velog.io/@heumheum2/React-Native-Multiple-Environments

[create from root]
> .env.development
> 
> .env.production


## PROJECT SETTING
```bash
yarn
```
```bash
cd ios && pod install
```


## RUN PROJECT - Scripts
[android]
```bash
yarn run android:dev # DEVELOPMENT MODE
yarn run android:prod # PRODUCTION MODE
yarn run android:dev:release # DEVELOPMENT RELEASE MODE
yarn run android:prod:release # PRODUCTION RELEASE MODE
yarn run android:dev-apk # DEVELOPMENT APK
yarn run android:dev-aab # DEVELOPMENT BUNDLE
yarn run android:prod-apk # PRODUCTION APK
yarn run android:prod-aab # PRODUCTION BUNDLE
```

[IOS]
```bash
yarn run ios:dev # DEVELOPMENT MODE
yarn run ios:prod # PRODUCTION MODE
yarn run ios:dev:release # DEVELOPMENT RELEASE MODE
yarn run ios:prod:release # PRODUCTION RELEASE MODE
```


## Gradle Clean

```bash
cd android                                                                     
./gradlew clean
cd ..
yarn run ${scripts}
```
