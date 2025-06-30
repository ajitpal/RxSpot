import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { X, Phone, MapPin, Search, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { PharmacyWithStatus, Medication, Report } from '@/types';
import { supabase, generateUserHash } from '@/lib/supabase';

interface PharmacyModalProps {
  pharmacy: PharmacyWithStatus | null;
  medications: Medication[];
  onClose: () => void;
  onReportSubmitted: (report: Report) => void;
}

export default function PharmacyModal({
  pharmacy,
  medications,
  onClose,
  onReportSubmitted,
}: PharmacyModalProps) {
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = medications.filter(med =>
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.generic_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMedications(filtered);
    } else {
      setFilteredMedications(medications);
    }
  }, [searchQuery, medications]);

  const submitReport = async (status: 'in_stock' | 'out_of_stock') => {
    if (!pharmacy || !selectedMedication) return;

    setIsSubmitting(true);
    try {
      const userHash = generateUserHash();
      
      const { data, error } = await supabase
        .from('reports')
        .insert({
          pharmacy_id: pharmacy.id,
          medication_id: selectedMedication.id,
          status,
          user_hash: userHash,
          confidence: 1.0,
        })
        .select('*, pharmacy(*), medication(*)')
        .single();

      if (error) throw error;

      onReportSubmitted(data);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pharmacy) return null;

  const renderMedicationItem = ({ item }: { item: Medication }) => (
    <TouchableOpacity
      style={[
        styles.medicationItem,
        selectedMedication?.id === item.id && styles.selectedMedication,
      ]}
      onPress={() => setSelectedMedication(item)}
    >
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.name}</Text>
        <Text style={styles.medicationGeneric}>{item.generic_name}</Text>
      </View>
      {item.common_shortage && (
        <View style={styles.shortageIndicator}>
          <Text style={styles.shortageText}>⚠️</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{pharmacy.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.pharmacyDetails}>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.address}>{pharmacy.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Phone size={16} color="#6b7280" />
              <Text style={styles.phone}>{pharmacy.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select Medication</Text>
          
          <View style={styles.searchContainer}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search medications..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <FlatList
            data={filteredMedications}
            keyExtractor={(item) => item.id}
            renderItem={renderMedicationItem}
            style={styles.medicationList}
            showsVerticalScrollIndicator={false}
          />

          {selectedMedication && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.reportButton, styles.inStockButton]}
                onPress={() => submitReport('in_stock')}
                disabled={isSubmitting}
              >
                <CheckCircle size={24} color="white" />
                <Text style={styles.buttonText}>In Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reportButton, styles.outOfStockButton]}
                onPress={() => submitReport('out_of_stock')}
                disabled={isSubmitting}
              >
                <XCircle size={24} color="white" />
                <Text style={styles.buttonText}>Out of Stock</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  pharmacyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  phone: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
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
    outline: 'none',
  },
  medicationList: {
    flex: 1,
    marginBottom: 20,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  selectedMedication: {
    backgroundColor: '#dbeafe',
    borderColor: '#0066CC',
    borderWidth: 2,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  medicationGeneric: {
    fontSize: 14,
    color: '#6b7280',
  },
  shortageIndicator: {
    marginLeft: 12,
  },
  shortageText: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  inStockButton: {
    backgroundColor: '#10B981',
  },
  outOfStockButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});