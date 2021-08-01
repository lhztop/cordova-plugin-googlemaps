//
//  PluginLocationService.m
//  cordova-googlemaps-plugin v2
//
//  Created by Masashi Katsumata.
//
//

#import "PluginLocationService.h"

@implementation PluginLocationService

- (void)pluginInitialize
{
    self.locationCommandQueue = [[NSMutableArray alloc] init];
    self.lastLocation = nil;
    if (self.locationManager == nil) {
        self.nativeLocationManager = [[CLLocationManager alloc] init];
        self.locationManager = [[AMapLocationManager alloc] init];
        self.searchApi = [ [AMapSearchAPI alloc] init];
        self.searchApi.delegate = self;
        self.locationManager.delegate = self;
    }
    
}

/**
 * Return 1 if the app has geolocation permission
 */
- (void)hasPermission:(CDVInvokedUrlCommand*)command {

    int result = 1;
    CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
    if (status == kCLAuthorizationStatusDenied ||
        status == kCLAuthorizationStatusRestricted) {
        result = 0;
    }
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:result];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];

}

-(void)getMyLocationInternal:(NSDictionary *)opts result:(NSMutableDictionary*)result
{
    CLLocationAccuracy locationAccuracy = kCLLocationAccuracyNearestTenMeters;
    
    BOOL isEnabledHighAccuracy = NO;
    if ([opts objectForKey:@"enableHighAccuracy"]) {
        isEnabledHighAccuracy = [[opts objectForKey:@"enableHighAccuracy"] boolValue];
    }

    if (isEnabledHighAccuracy == YES) {
        locationAccuracy = kCLLocationAccuracyBestForNavigation;
        self.locationManager.distanceFilter = 5;
    } else {
        self.locationManager.distanceFilter = 10;
    }
    self.locationManager.desiredAccuracy = locationAccuracy;

    //http://stackoverflow.com/questions/24268070/ignore-ios8-code-in-xcode-5-compilation
    [self.nativeLocationManager requestWhenInUseAuthorization];
    //   定位超时时间，最低2s，此处设置为2s
    self.locationManager.locationTimeout =16;
    //   逆地理请求超时时间，最低2s，此处设置为2s
    self.locationManager.reGeocodeTimeout = 10;
    
    // 带逆地理（返回坐标和地址信息）。将下面代码中的 YES 改成 NO ，则不会返回地址信息。
    [self.locationManager requestLocationWithReGeocode:YES completionBlock:^(CLLocation *location, AMapLocationReGeocode *regeocode, NSError *error) {
            
        if (error)
        {
            NSLog(@"locError:{%ld - %@};", (long)error.code, error.localizedDescription);
            
            if (error.code == AMapLocationErrorLocateFailed)
            {
                return;
            }
        }
            
        self.lastLocation = location;
        [self parseLocation:location regeocode:regeocode result:result];
        self.lastResult = result;
        NSMutableDictionary *request = [NSMutableDictionary dictionary];
        [request setObject:[NSNumber numberWithDouble:location.coordinate.latitude] forKey:@"lat"];
        [request setObject:[NSNumber numberWithDouble:location.coordinate.longitude] forKey:@"lng"];
        [request setObject:regeocode.citycode forKey:@"city_code"];
        [self getNearbyPoi:request result:result];
        }];
}

-(void)parseLocation:(CLLocation *)location regeocode:(AMapLocationReGeocode *)regeocode result:(NSMutableDictionary*)result
{
    NSMutableDictionary *latLng = [NSMutableDictionary dictionary];
    [latLng setObject:[NSNumber numberWithDouble:location.coordinate.latitude] forKey:@"lat"];
    [latLng setObject:[NSNumber numberWithDouble:location.coordinate.longitude] forKey:@"lng"];
    [result setObject:latLng forKey:@"latLng"];
    if (regeocode) {
        [result setObject:regeocode.city forKey:@"city_name"];
        [result setObject:regeocode.citycode forKey:@"city_code"];
        [result setObject:regeocode.POIName forKey:@"poi"];
    }
}

-(NSMutableArray*) parsePoiResult:(AMapPOISearchResponse *)response
{
    NSMutableArray* arr = [[NSMutableArray alloc] init];
    for(int i=0; i<response.pois.count; i++) {
        AMapPOI* poi = response.pois[i];
        NSMutableDictionary *item = [[NSMutableDictionary alloc] init];
        [item setObject:poi.name forKey:@"name"];
        [item setObject:poi.address forKey:@"address"];
        [item setObject:[NSNumber numberWithLong:poi.distance] forKey:@"distance"];
        NSMutableDictionary *latLng = [NSMutableDictionary dictionary];
        [latLng setObject:[NSNumber numberWithDouble:poi.location.latitude] forKey:@"lat"];
        [latLng setObject:[NSNumber numberWithDouble:poi.location.longitude] forKey:@"lng"];
        [item setObject:latLng forKey:@"latLng"];
        [item setObject:poi.typecode forKey:@"cat_id"];
        [item setObject:poi.type forKey:@"cat_desc"];
        [arr addObject:item];
    }
    return arr;
}

-(void)onPOISearchDone:(AMapPOISearchBaseRequest *)request response:(AMapPOISearchResponse *)response
{
    NSMutableDictionary *json = [NSMutableDictionary dictionaryWithDictionary:self.lastResult];
    [json setObject:[self parsePoiResult:response] forKey:@"poi_list"];
    for (CDVInvokedUrlCommand *command in self.locationCommandQueue) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:json];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }

    [self.locationCommandQueue removeAllObjects];
    [self.locationManager stopUpdatingLocation];
        
}

-(void)getNearbyPoi:(NSDictionary *)opts result:(NSMutableDictionary*)result
{
    AMapPOIAroundSearchRequest *request = [[AMapPOIAroundSearchRequest alloc] init];
        
    request.location   = [AMapGeoPoint locationWithLatitude:[[opts objectForKey:@"lat"] doubleValue] longitude:[[opts objectForKey:@"lng"] doubleValue]];
    request.keywords            = @"";
    /* 按照距离排序. */
    request.sortrule            = 0;
    request.radius = 1000;
    [request setCity:[opts objectForKey:@"city_code"]];
    [request setTypes:@"06|07|10|12|14|17|19|20"];
    request.offset = 25;  //每页25条
    [self.searchApi AMapPOIAroundSearch:request];
}

/**
 * Return the current position based on GPS
 */
-(void)getMyLocation:(CDVInvokedUrlCommand *)command
{
  dispatch_async(dispatch_get_main_queue(), ^{
    // Obtain the authorizationStatus
    CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
    if (status == kCLAuthorizationStatusDenied ||
        status == kCLAuthorizationStatusRestricted) {
        //----------------------------------------------------
        // kCLAuthorizationStatusDenied
        // kCLAuthorizationStatusRestricted
        //----------------------------------------------------

        NSString *error_code = @"service_denied";
        NSString *error_message = [PluginUtil PGM_LOCALIZATION:@"LOCATION_IS_DENIED_MESSAGE"];

        NSMutableDictionary *json = [NSMutableDictionary dictionary];
        [json setObject:[NSNumber numberWithBool:NO] forKey:@"status"];
        [json setObject:[NSString stringWithString:error_message] forKey:@"error_message"];
        [json setObject:[NSString stringWithString:error_code] forKey:@"error_code"];

        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:json];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
//
//        NSString *LOCATION_IS_UNAVAILABLE_ERROR_TITLE = [PluginUtil PGM_LOCALIZATION:@"LOCATION_IS_UNAVAILABLE_ERROR_TITLE"];
//        NSString *LOCATION_IS_UNAVAILABLE_ERROR_MESSAGE = [PluginUtil PGM_LOCALIZATION:@"LOCATION_IS_UNAVAILABLE_ERROR_MESSAGE"];
//        UIAlertController* alert = [UIAlertController alertControllerWithTitle:LOCATION_IS_UNAVAILABLE_ERROR_TITLE
//                                                                       message:LOCATION_IS_UNAVAILABLE_ERROR_MESSAGE
//                                                                preferredStyle:UIAlertControllerStyleAlert];
//
//        NSString *closeBtnLabel = [PluginUtil PGM_LOCALIZATION:@"CLOSE_BUTTON"];
//        UIAlertAction* ok = [UIAlertAction actionWithTitle:closeBtnLabel
//                                                     style:UIAlertActionStyleDefault
//                                                   handler:^(UIAlertAction* action)
//            {
//                NSString *error_code = @"service_denied";
//                NSString *error_message = [PluginUtil PGM_LOCALIZATION:@"LOCATION_IS_DENIED_MESSAGE"];
//
//                NSMutableDictionary *json = [NSMutableDictionary dictionary];
//                [json setObject:[NSNumber numberWithBool:NO] forKey:@"status"];
//                [json setObject:[NSString stringWithString:error_message] forKey:@"error_message"];
//                [json setObject:[NSString stringWithString:error_code] forKey:@"error_code"];
//
//                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:json];
//                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
//                [alert dismissViewControllerAnimated:YES completion:nil];
//            }];
//
//        [alert addAction:ok];
//
//
//        [self.viewController presentViewController:alert
//                                          animated:YES
//                                        completion:nil];

    }
    
    NSDictionary *opts = [command.arguments objectAtIndex:0];
      NSMutableDictionary *result = [NSMutableDictionary dictionary];
      if ([opts objectForKey:@"lat"] == nil) {
          if (self.lastLocation && -[self.lastLocation.timestamp timeIntervalSinceNow] < 2) {
              //---------------------------------------------------------------------
              // If the user requests the location in two seconds from the last time,
              // return the last result in order to save battery usage.
              // (Don't request the device location too much! Save battery usage!)
              //---------------------------------------------------------------------
              CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:self.lastResult];
              [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
              return;
          }
          [self getMyLocationInternal:opts result:result];
      } else {
          [self getNearbyPoi:opts result:result];
      }
    
    //----------------------------------------------------
    // kCLAuthorizationStatusNotDetermined
    // kCLAuthorizationStatusAuthorized
    // kCLAuthorizationStatusAuthorizedAlways
    // kCLAuthorizationStatusAuthorizedWhenInUse
    //----------------------------------------------------
    

    

//    if (self.locationCommandQueue.count == 0) {
//      // Executes getMyLocation() first time
//
//      [self.locationManager stopUpdatingLocation];
//
//      // Why do I have to still support iOS9?
//      [NSTimer scheduledTimerWithTimeInterval:16000
//                                         target:self
//                                         selector:@selector(locationFailed)
//                                         userInfo:nil
//                                         repeats:NO];
//    }
    [self.locationCommandQueue addObject:command];

    //CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    //[pluginResult setKeepCallbackAsBool:YES];
    //[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
  });
}

-(void)locationFailed
{
    if (self.lastLocation != nil) {
        return;
    }

    // Timeout
    [self.locationManager stopUpdatingLocation];

    NSMutableDictionary *json = [NSMutableDictionary dictionary];
    [json setObject:[NSNumber numberWithBool:NO] forKey:@"status"];
    NSString *error_code = @"error";
    NSString *error_message = [PluginUtil PGM_LOCALIZATION:@"CAN_NOT_GET_LOCATION_MESSAGE"];
    [json setObject:[NSString stringWithString:error_message] forKey:@"error_message"];
    [json setObject:[NSString stringWithString:error_code] forKey:@"error_code"];

    for (CDVInvokedUrlCommand *command in self.locationCommandQueue) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:json];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    [self.locationCommandQueue removeAllObjects];
}


- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
    self.lastLocation = nil;
    self.lastResult = nil;

    NSMutableDictionary *json = [NSMutableDictionary dictionary];
    [json setObject:[NSNumber numberWithBool:NO] forKey:@"status"];
    NSString *error_code = @"error";
    NSString *error_message = [PluginUtil PGM_LOCALIZATION:@"CAN_NOT_GET_LOCATION_MESSAGE"];
    if (error.code == kCLErrorDenied) {
        error_code = @"service_denied";
        error_message = [PluginUtil PGM_LOCALIZATION:@"LOCATION_REJECTED_BY_USER_MESSAGE"];
    }

    [json setObject:[NSString stringWithString:error_message] forKey:@"error_message"];
    [json setObject:[NSString stringWithString:error_code] forKey:@"error_code"];

    for (CDVInvokedUrlCommand *command in self.locationCommandQueue) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsDictionary:json];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    [self.locationCommandQueue removeAllObjects];

}

@end
