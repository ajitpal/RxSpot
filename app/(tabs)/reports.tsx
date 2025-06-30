import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { ChartBar as BarChart3, Clock, MapPin, Pill } from 'lucide-react-native';
import { Report, PharmacyWithStatus } from '@/types';
import { supabase, calculateConfidence } from '@/lib/supabase';

interface ReportWithDetails extends Report {
  pharmacy: {
    name: string;
    address: string;
  };
  medication: {
    name: string;
    generic_name: string;
  };
}

export default function ReportsScreen() {
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    reportsToday: 0,
    inStockReports: 0,
    outOfStockReports: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          pharmacy:pharmacies(*),
          medication:medications(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const reportsWithConfidence = data.map(report => ({
        ...report,
        confidence: calculateConfidence(report)
      }));

      setReports(reportsWithConfidence);
      calculateStats(reportsWithConfidence);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (reportsData: ReportWithDetails[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats = {
      totalReports: reportsData.length,
      reportsToday: reportsData.filter(report => 
        new Date(report.created_at) >= todayStart
      ).length,
      inStockReports: reportsData.filter(report => 
        report.status === 'in_stock' && report.confidence > 0.3
      ).length,
      outOfStockReports: reportsData.filter(report => 
        report.status === 'out_of_stock' && report.confidence > 0.3
      ).length,
    };

    setStats(stats);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderReportItem = ({ item }: { item: ReportWithDetails }) => {
    const confidencePercent = Math.round(item.confidence * 100);
    const isReliable = item.confidence > 0.3;

    return (
      <View style={[styles.reportItem, !isReliable && styles.unreliableReport]}>
        <View style={styles.reportHeader}>
          <View style={styles.reportStatus}>
            <View style={[
              styles.statusIndicator,
              item.status === 'in_stock' 
                ? styles.inStockIndicator 
                : styles.outOfStockIndicator
            ]} />
            <Text style={[
              styles.statusText,
              item.status === 'in_stock' 
                ? styles.inStockText 
                : styles.outOfStockText
            ]}>
              {item.status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
          <Text style={styles.confidenceText}>
            {confidencePercent}% confidence
          </Text>
        </View>

        <View style={styles.reportDetails}>
          <View style={styles.detailRow}>
            <Pill size={16} color="#6b7280" />
            <Text style={styles.medicationName}>{item.medication.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.pharmacyName}>{item.pharmacy.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color="#6b7280" />
            <Text style={styles.timeText}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Reports</Text>
        <Text style={styles.subtitle}>Community medication availability updates</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total Reports"
          value={stats.totalReports}
          icon={<BarChart3 size={24} color="#0066CC" />}
        />
        <StatCard
          title="Today"
          value={stats.reportsToday}
          icon={<Clock size={24} color="#10B981" />}
        />
        <StatCard
          title="In Stock"
          value={stats.inStockReports}
          icon={<Pill size={24} color="#10B981" />}
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockReports}
          icon={<Pill size={24} color="#EF4444" />}
        />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        style={styles.reportsList}
        contentContainerStyle={styles.reportsContent}
        showsVerticalScrollIndicator={false}
      />
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  reportsList: {
    flex: 1,
  },
  reportsContent: {
    padding: 20,
    gap: 12,
  },
  reportItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unreliableReport: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  inStockIndicator: {
    backgroundColor: '#10B981',
  },
  outOfStockIndicator: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inStockText: {
    color: '#10B981',
  },
  outOfStockText: {
    color: '#EF4444',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  reportDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pharmacyName: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});