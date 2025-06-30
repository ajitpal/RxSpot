import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Settings as SettingsIcon, Bell, MapPin, Info, CircleHelp as HelpCircle, Shield, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || <ChevronRight size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your RxSpot experience</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <SettingItem
            icon={<Bell size={24} color="#0066CC" />}
            title="Push Notifications"
            subtitle="Get notified about stock updates"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#0066CC' }}
                thumbColor="#ffffff"
              />
            }
          />

          <SettingItem
            icon={<MapPin size={24} color="#0066CC" />}
            title="Location Services"
            subtitle="Find pharmacies near you"
            rightElement={
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#d1d5db', true: '#0066CC' }}
                thumbColor="#ffffff"
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          
          <SettingItem
            icon={<Info size={24} color="#0066CC" />}
            title="About RxSpot"
            subtitle="Version 1.0.0"
            onPress={() => {}}
          />

          <SettingItem
            icon={<HelpCircle size={24} color="#0066CC" />}
            title="Help & Support"
            subtitle="Get help using the app"
            onPress={() => {}}
          />

          <SettingItem
            icon={<Shield size={24} color="#0066CC" />}
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={() => {}}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How RxSpot Works</Text>
          <Text style={styles.infoText}>
            RxSpot is a community-driven platform that helps you find medication availability at nearby pharmacies. 
            Reports are anonymous and use a smart confidence system that considers timing and community feedback.
          </Text>
          <View style={styles.confidenceExplainer}>
            <Text style={styles.confidenceTitle}>Confidence System:</Text>
            <Text style={styles.confidenceItem}>• New reports start at 100% confidence</Text>
            <Text style={styles.confidenceItem}>• Confidence decreases over 24 hours</Text>
            <Text style={styles.confidenceItem}>• Conflicting reports are weighted together</Text>
            <Text style={styles.confidenceItem}>• Only reports above 30% confidence are shown</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  confidenceExplainer: {
    gap: 6,
  },
  confidenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  confidenceItem: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});