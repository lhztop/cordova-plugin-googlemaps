//
//  PluginEnvironment.m
//  cordova-googlemaps-plugin v2
//
//  Created by Masashi Katsumata.
//
//

#import "PluginEnvironment.h"

@implementation PluginEnvironment

dispatch_queue_t queue;

- (void)pluginInitialize
{
  queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0ul);
}

- (void)pluginUnload
{
  queue = nil;
}
- (void)isAvailable:(CDVInvokedUrlCommand *)command {
}

- (void)setBackGroundColor:(CDVInvokedUrlCommand *)command {

  dispatch_async(queue, ^{
      // Load the GoogleMap.m
      CDVViewController *cdvViewController = (CDVViewController*)self.viewController;
      CordovaGoogleMaps *googlemaps = [cdvViewController getCommandInstance:@"CordovaGoogleMaps"];

      NSArray *rgbColor = [command.arguments objectAtIndex:0];
      dispatch_async(dispatch_get_main_queue(), ^{
          googlemaps.pluginLayer.backgroundColor = [rgbColor parsePluginColor];
      });

      CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
      [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
  });
}

- (void)getLicenseInfo:(CDVInvokedUrlCommand *)command {
}

- (void)setEnv:(CDVInvokedUrlCommand *)command {
  // stub
  CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
  [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}
@end
