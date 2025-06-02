import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  Eye,
  Shield,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import AnimatedWrapper from '@/components/ui/animated-wrapper';

const Settings = () => {
  const { preferences, updatePreference, updatePreferences, resetPreferences, exportPreferences, importPreferences } = useUserPreferences();
  const { toast } = useToast();
  const [importData, setImportData] = useState('');

  const handleExport = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-preferences.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Settings Exported',
      description: 'Your preferences have been exported successfully.',
    });
  };

  const handleImport = () => {
    if (importPreferences(importData)) {
      toast({
        title: 'Settings Imported',
        description: 'Your preferences have been imported successfully.',
      });
      setImportData('');
    } else {
      toast({
        title: 'Import Failed',
        description: 'Invalid preferences data. Please check the format.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    resetPreferences();
    toast({
      title: 'Settings Reset',
      description: 'All preferences have been reset to defaults.',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AnimatedWrapper animation="slideUp">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </AnimatedWrapper>

      <Tabs defaultValue="appearance" className="space-y-6">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap gap-3 justify-center">
            <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
              >
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="accessibility"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
              >
                <Eye className="h-4 w-4" />
                Accessibility
              </TabsTrigger>
            </TabsList>

            <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
              <TabsTrigger
                value="privacy"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
              >
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                Data
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <AnimatedWrapper animation="fadeIn" delay={100}>
            <Card>
              <CardHeader>
                <CardTitle>Appearance Preferences</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dashboard Layout</Label>
                    <div className="text-sm text-muted-foreground">
                      Choose how your dashboard is displayed
                    </div>
                  </div>
                  <Select
                    value={preferences.dashboardLayout}
                    onValueChange={(value: 'grid' | 'list') => updatePreference('dashboardLayout', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compact Mode</Label>
                    <div className="text-sm text-muted-foreground">
                      Use more compact spacing throughout the app
                    </div>
                  </div>
                  <Switch
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) => updatePreference('compactMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Default Content View</Label>
                    <div className="text-sm text-muted-foreground">
                      How content lists are displayed by default
                    </div>
                  </div>
                  <Select
                    value={preferences.defaultContentView}
                    onValueChange={(value: 'card' | 'list' | 'table') => updatePreference('defaultContentView', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <AnimatedWrapper animation="fadeIn" delay={100}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive browser push notifications
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notification Sound</Label>
                    <div className="text-sm text-muted-foreground">
                      Play sound for new notifications
                    </div>
                  </div>
                  <Switch
                    checked={preferences.notificationSound}
                    onCheckedChange={(checked) => updatePreference('notificationSound', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notification Frequency</Label>
                    <div className="text-sm text-muted-foreground">
                      How often to receive notifications
                    </div>
                  </div>
                  <Select
                    value={preferences.notificationFrequency}
                    onValueChange={(value: 'immediate' | 'hourly' | 'daily') => updatePreference('notificationFrequency', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </TabsContent>

        {/* Accessibility Settings */}
        <TabsContent value="accessibility">
          <AnimatedWrapper animation="fadeIn" delay={100}>
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Preferences</CardTitle>
                <CardDescription>
                  Customize the app for better accessibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Reduced Motion</Label>
                    <div className="text-sm text-muted-foreground">
                      Minimize animations and transitions
                    </div>
                  </div>
                  <Switch
                    checked={preferences.reducedMotion}
                    onCheckedChange={(checked) => updatePreference('reducedMotion', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">High Contrast</Label>
                    <div className="text-sm text-muted-foreground">
                      Use higher contrast colors
                    </div>
                  </div>
                  <Switch
                    checked={preferences.highContrast}
                    onCheckedChange={(checked) => updatePreference('highContrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Font Size</Label>
                    <div className="text-sm text-muted-foreground">
                      Adjust the base font size
                    </div>
                  </div>
                  <Select
                    value={preferences.fontSize}
                    onValueChange={(value: 'small' | 'medium' | 'large') => updatePreference('fontSize', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <AnimatedWrapper animation="fadeIn" delay={100}>
            <Card>
              <CardHeader>
                <CardTitle>Privacy Preferences</CardTitle>
                <CardDescription>
                  Control your privacy and data sharing settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Profile Visibility</Label>
                    <div className="text-sm text-muted-foreground">
                      Who can see your profile information
                    </div>
                  </div>
                  <Select
                    value={preferences.profileVisibility}
                    onValueChange={(value: 'public' | 'private' | 'friends') => updatePreference('profileVisibility', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Activity Tracking</Label>
                    <div className="text-sm text-muted-foreground">
                      Allow tracking of your activity for personalization
                    </div>
                  </div>
                  <Switch
                    checked={preferences.activityTracking}
                    onCheckedChange={(checked) => updatePreference('activityTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Analytics Opt-in</Label>
                    <div className="text-sm text-muted-foreground">
                      Help improve the app by sharing anonymous usage data
                    </div>
                  </div>
                  <Switch
                    checked={preferences.analyticsOptIn}
                    onCheckedChange={(checked) => updatePreference('analyticsOptIn', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <AnimatedWrapper animation="fadeIn" delay={100}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Export, import, or reset your preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Export Settings</Label>
                      <div className="text-sm text-muted-foreground">
                        Download your preferences as a JSON file
                      </div>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-base">Import Settings</Label>
                    <div className="text-sm text-muted-foreground">
                      Upload a previously exported preferences file
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleImport} variant="outline" disabled={!importData.trim()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Reset All Settings</Label>
                      <div className="text-sm text-muted-foreground">
                        Reset all preferences to their default values
                      </div>
                    </div>
                    <Button onClick={handleReset} variant="destructive">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Settings</CardTitle>
                  <CardDescription>
                    Overview of your current preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Layout</Label>
                      <Badge variant="secondary">{preferences.dashboardLayout}</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Font Size</Label>
                      <Badge variant="secondary">{preferences.fontSize}</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Notifications</Label>
                      <Badge variant={preferences.emailNotifications ? "default" : "secondary"}>
                        {preferences.emailNotifications ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Motion</Label>
                      <Badge variant={preferences.reducedMotion ? "secondary" : "default"}>
                        {preferences.reducedMotion ? "Reduced" : "Normal"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Privacy</Label>
                      <Badge variant="secondary">{preferences.profileVisibility}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimatedWrapper>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
