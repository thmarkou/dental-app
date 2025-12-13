#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  // Debug mode: Use Metro bundler
  // For simulator, use localhost (no network permission needed)
  // For real device, RCTBundleURLProvider will use network IP
#if TARGET_IPHONE_SIMULATOR
  return [NSURL URLWithString:@"http://localhost:8081/index.bundle?platform=ios&dev=true"];
#else
  // For real device, use RCTBundleURLProvider which handles network discovery
  // Make sure NSLocalNetworkUsageDescription is set in Info.plist
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#endif
#else
  // Release mode: Use bundled JavaScript file
  NSURL *jsBundleURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  if (!jsBundleURL) {
    // Try main 2.jsbundle as fallback (if Xcode created it with space)
    jsBundleURL = [[NSBundle mainBundle] URLForResource:@"main 2" withExtension:@"jsbundle"];
  }
  if (jsBundleURL) {
    return jsBundleURL;
  }
  // This should not happen - bundle should always be present in Release builds
  NSLog(@"ERROR: JavaScript bundle not found! Looking for: main.jsbundle or main 2.jsbundle");
  @throw [NSException exceptionWithName:@"BundleNotFound" 
                                  reason:@"JavaScript bundle not found in Release build. Make sure main.jsbundle is included in Copy Bundle Resources." 
                                userInfo:nil];
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
