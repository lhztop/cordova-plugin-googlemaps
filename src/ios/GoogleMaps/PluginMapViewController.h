//
//  PluginMapViewController.h
//  cordova-googlemaps-plugin v2
//
//  Created by Masashi Katsumata.
//
//

#import <Cordova/CDV.h>
#import <UIKit/UIKit.h>
#import <math.h>
#import "PluginUtil.h"
#import "IPluginProtocol.h"
#import "PluginObjects.h"
#import "PluginViewController.h"
// #import <GoogleMaps/GoogleMaps.h>
#import <AMapNaviKit/MAMapKit.h>
#import "GMSCoordinateBounds+Geometry.h"
@interface PluginMapViewController : PluginViewController<MAMapViewDelegate>

@property (nonatomic) MAPointAnnotation* activeMarker;
@property (nonatomic) MAMapView* map;

- (BOOL)didTapMyLocationButtonForMapView:(MAMapView *)mapView;
//- (void)didChangeActiveBuilding: (GMSIndoorBuilding *)building;
//- (void)didChangeActiveLevel: (GMSIndoorLevel *)level;
@end
