import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Search, Filter, RefreshCw } from 'lucide-react-native';
import MapView from '@/components/MapView';
import PharmacyModal from '@/components/PharmacyModal';
import { PharmacyWithStatus, Medication, Report, UserLocation } from '@/types';
import { supabase, calculateConfidence } from '@/lib/supabase';
import { getUserLocation } from '@/lib/location';

export default function MapScreen() {
  const [pharmacies, setPharmacies] = useState<PharmacyWithStatus[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithStatus | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    initializeData();
    setupRealtimeSubscription();
  }, []);

  const initializeData = async () => {
    try {
      // Get user location
      const location = await getUserLocation();
      setUserLocation(location);

      // Load pharmacies and medications
      await Promise.all([loadPharmacies(), loadMedications()]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPharmacies = async () => {
    try {
      const { data: pharmaciesData, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get latest reports for each pharmacy
      const pharmaciesWithStatus = await Promise.all(
        pharmaciesData.map(async (pharmacy) => {
          const { data: reports } = await supabase
            .from('reports')
            .select('*, medication(*)')
            .eq('pharmacy_id', pharmacy.id)
            .order('created_at', { ascending: false })
            .limit(10);

          let status: 'in_stock' | 'out_of_stock' | 'unknown' = 'unknown';
          let confidence = 0;
          let lastUpdated: string | undefined;

          if (reports && reports.length > 0) {
            // Calculate confidence for recent reports
            const validReports = reports
              .map(report => ({
                ...report,
                confidence: calculateConfidence(report)
              }))
              .filter(report => report.confidence > 0.3);

            if (validReports.length > 0) {
              const latest = validReports[0];
              status = latest.status as 'in_stock' | 'out_of_stock';
              confidence = latest.confidence;
              lastUpdated = latest.created_at;
            }
          }

          return {
            ...pharmacy,
            status,
            confidence,
            last_updated: lastUpdated,
          };
        })
      );

      setPharmacies(pharmaciesWithStatus);
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    }
  };

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('name');

      if (error) throw error;
      setMedications(data);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
        },
        (payload) => {
          handleNewReport(payload.new as Report);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNewReport = (newReport: Report) => {
    setPharmacies(prev => prev.map(pharmacy => {
      if (pharmacy.id === newReport.pharmacy_id) {
        return {
          ...pharmacy,
          status: newReport.status,
          confidence: newReport.confidence,
          last_updated: newReport.created_at,
        };
      }
      return pharmacy;
    }));
    setLastUpdate(new Date());
  };

  const handlePharmacySelect = (pharmacy: PharmacyWithStatus) => {
    setSelectedPharmacy(pharmacy);
  };

  const handleReportSubmitted = (report: Report) => {
    handleNewReport(report);
  };

  const refreshData = async () => {
    setIsLoading(true);
    await loadPharmacies();
    setIsLoading(false);
    setLastUpdate(new Date());
  };

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    !searchQuery || 
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading pharmacy data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RxSpot</Text>
        <Text style={styles.subtitle}>Find medication availability near you</Text>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pharmacies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
            <RefreshCw size={20} color="#0066CC" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {filteredPharmacies.length} pharmacies nearby
          </Text>
          <Text style={styles.lastUpdateText}>
            Updated {formatLastUpdate(lastUpdate)}
          </Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          pharmacies={filteredPharmacies}
          selectedMedication={selectedMedication}
          userLocation={userLocation}
          onPharmacySelect={handlePharmacySelect}
        />
      </View>

      <PharmacyModal
        pharmacy={selectedPharmacy}
        medications={medications}
        onClose={() => setSelectedPharmacy(null)}
        onReportSubmitted={handleReportSubmitted}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
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
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  refreshButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  mapContainer: {
    flex: 1,
    padding: 20,
  },
});