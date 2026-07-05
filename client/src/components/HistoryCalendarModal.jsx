import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configurare limbă română pentru calendar
LocaleConfig.locales['ro'] = {
  monthNames: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
  monthNamesShort: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'],
  dayNames: ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
  dayNamesShort: ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'],
  today: 'Azi'
};
LocaleConfig.defaultLocale = 'ro';

const { width } = Dimensions.get('window');

const HistoryCalendarModal = ({ visible, onClose, allActivityDates = [] }) => {
    // Generăm un obiect markedDates necesar pentru react-native-calendars
    // Formatează un date string în 'YYYY-MM-DD'
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const markedDates = {};
    
    // Pentru fiecare zi în care a existat activitate, punem un punct colorat și styling special
    allActivityDates.forEach(date => {
        const formattedDate = formatDate(date);
        markedDates[formattedDate] = {
            selected: true,
            selectedColor: '#6366f1', // Culoarea de brand pentru highlight
            selectedTextColor: 'white',
        };
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Istoric Învățare</Text>
                            <Text style={styles.subtitle}>Toate zilele tale active</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Calendar Component */}
                    <View style={styles.calendarWrapper}>
                        <Calendar
                            // Stylizarea temei de calendar
                            theme={{
                                backgroundColor: '#ffffff',
                                calendarBackground: '#ffffff',
                                textSectionTitleColor: '#94a3b8',
                                selectedDayBackgroundColor: '#6366f1',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#f59e0b',
                                dayTextColor: '#1e293b',
                                textDisabledColor: '#e2e8f0',
                                dotColor: '#6366f1',
                                selectedDotColor: '#ffffff',
                                arrowColor: '#6366f1',
                                monthTextColor: '#1e293b',
                                indicatorColor: '#6366f1',
                                textDayFontWeight: '600',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '800',
                                textDayFontSize: 14,
                                textMonthFontSize: 18,
                            }}
                            markedDates={markedDates}
                            firstDay={1} // Începe de Luni
                            enableSwipeMonths={true}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: width * 0.9,
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
    },
    calendarWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        minHeight: 380,
    }
});

export default HistoryCalendarModal;
