//
//  PluginLocationService.h
//  cordova-googlemaps-plugin v2
//
//  Created by Masashi Katsumata.
//
//

#import <Cordova/CDV.h>
#import <AMapLocationKit/AMapLocationKit.h>
#import <AMapSearchKit/AMapSearchKit.h>
#import "PluginUtil.h"

@interface PluginLocationService : CDVPlugin<AMapLocationManagerDelegate, AMapSearchDelegate>

@property (nonatomic, strong) NSMutableDictionary *lastResult;
@property (nonatomic, strong) CLLocation *lastLocation;
@property (nonatomic, strong) CLLocationManager *nativeLocationManager;
@property (nonatomic, strong) AMapLocationManager *locationManager;
@property (nonatomic, strong) AMapSearchAPI *searchApi;
@property (nonatomic, strong) NSMutableArray *locationCommandQueue;
- (void)getMyLocation:(CDVInvokedUrlCommand*)command;
- (void)hasPermission:(CDVInvokedUrlCommand*)command;
@end
