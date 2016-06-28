//
//  GoogleMaps.h
//  SimpleMap
//
//  Created by masashi on 10/31/13.
//
//

#import <Cordova/CDV.h>
#import <GoogleMaps/GoogleMaps.h>
#import "GoogleMapsViewController.h"
#import "PluginUtil.h"
#import "MyReachability.h"
#import "Map.h"
#import "MyPluginLayer.h"

@interface GoogleMaps : CDVPlugin<CLLocationManagerDelegate>

@property (nonatomic) MyPluginLayer *pluginLayer;
@property (nonatomic, strong) CLLocationManager *locationManager;
@property (nonatomic, strong) NSMutableArray *locationCommandQueue;
@property (nonatomic) NSMutableDictionary *mapPlugins;

- (void)exec:(CDVInvokedUrlCommand*)command;
- (void)getMap:(CDVInvokedUrlCommand*)command;
- (void)getLicenseInfo:(CDVInvokedUrlCommand*)command;
- (void)getMyLocation:(CDVInvokedUrlCommand*)command;
- (void)isAvailable:(CDVInvokedUrlCommand *)command;
@end
