import { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, ActivityIndicator, Image, TextInput, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/stores/useAuth';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../src/config';
import CustomAlert from '../../src/components/CustomAlert';

export default function ProfileScreen() {
    const { user, setUser, selectedCareer, setSelectedCareer } = useAuth();
    const router = useRouter();
    const [skills, setSkills] = useState([]);
    const [savedCourses, setSavedCourses] = useState([]);

    const [updating, setUpdating] = useState(false);
    const [skillsExpanded, setSkillsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('skills');

    // Cursuri / Promovare Skills din Cursuri
    const [promoteModalVisible, setPromoteModalVisible] = useState(false);
    const [courseToComplete, setCourseToComplete] = useState(null);

    // Profile Edit State
    const [isProfileModalVisible, setProfileModalVisible] = useState(false);
    const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
    const [editLastName, setEditLastName] = useState(user?.lastName || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'info',
        confirmText: 'Confirmă'
    });

    const showAlert = (config) => {
        setAlertConfig({
            ...config,
            onConfirm: config.onConfirm || (() => setAlertVisible(false))
        });
        setAlertVisible(true);
    };

    // Quick Add Skill State
    const [newSkill, setNewSkill] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [addingSkill, setAddingSkill] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (newSkill.trim().length > 0) {
                try {
                    const res = await fetch(`${API_URL}/api/cv/suggest-skills?q=${encodeURIComponent(newSkill)}`, {
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    });
                    const data = await res.json();
                    setSuggestions(data.suggestions || []);
                } catch (e) {
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [newSkill, user?.token]);

    const handleAddCustomSkill = async () => {
        if (!newSkill.trim()) return;
        setAddingSkill(true);
        try {
            const response = await fetch(`${API_URL}/api/cv/add-skill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ skillName: newSkill, level: 'Intermediate' })
            });

            const data = await response.json();
            if (response.ok) {
                setNewSkill('');
                setSuggestions([]);
                fetchData(); // Refresh list immediately
                showAlert({ title: 'Succes', message: `Am adăugat ${data.skill.name} la portofoliul tău.`, type: 'success' });
            } else {
                showAlert({ title: 'Eroare', message: data.error || 'Nu s-a putut adăuga competența.', type: 'error' });
            }
        } catch (error) {
            showAlert({ title: 'Eroare', message: 'Eroare de conexiune.', type: 'error' });
        } finally {
            setAddingSkill(false);
        }
    };

    const fetchData = useCallback(async () => {
        if (!user?.token) return;
        try {
            const resProfile = await fetch(`${API_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const profileData = await resProfile.json();
            if (resProfile.ok) {
                setUser({ ...profileData, token: user.token });
                if (profileData.selectedCareerId && !selectedCareer) {
                    setSelectedCareer(profileData.selectedCareerId);
                }
            }

            const resSkills = await fetch(`${API_URL}/api/cv/my-skills`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const skillsData = await resSkills.json();
            if (resSkills.ok) setSkills(skillsData.skills || []);

            const resCourses = await fetch(`${API_URL}/api/careers/my-courses`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const coursesData = await resCourses.json();
            if (resCourses.ok) setSavedCourses(coursesData.courses || []);

        } catch (error) {
            console.error("Eroare refresh date profil:", error);
        }
    }, [user?.token, selectedCareer, setSelectedCareer, setUser]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const logout = () => {
        setUser(null);
        setSelectedCareer(null);
        router.replace('/');
    };

    const openPromoteSkillModal = (course) => {
        setCourseToComplete(course);
        setPromoteModalVisible(true);
    };

    const handlePromoteSkill = async (skillToPromote) => {
        let nextLevel = 'Intermediate';
        if (skillToPromote.level === 'Beginner') nextLevel = 'Intermediate';
        else if (skillToPromote.level === 'Intermediate') nextLevel = 'Advanced';
        else nextLevel = 'Advanced'; // Rămâne la fel, dar actualizăm statusul cursului

        setUpdating(true);
        try {
            // 1. Ștergem cursul salvat
            await fetch(`${API_URL}/api/careers/unsave-course`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ courseId: courseToComplete.id })
            });

            // 2. Creștem nivelul competenței
            await fetch(`${API_URL}/api/cv/add-skill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ skillName: skillToPromote.name, level: nextLevel })
            });

            setPromoteModalVisible(false);
            setCourseToComplete(null);
            fetchData();
            showAlert({ title: "Felicitări!", message: `Ai aprofundat cursul! Nivelul tău pentru ${skillToPromote.name} este acum ${nextLevel === 'Advanced' ? 'Avansat' : 'Intermediar'}.`, type: 'success' });
        } catch (error) {
            console.error(error);
            showAlert({ title: "Eroare", message: "Nu s-a putut actualiza competența.", type: 'danger' });
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteSkill = async (skillName) => {
        showAlert({
            title: "Ștergere Competență",
            message: `Ești sigur că vrei să ștergi ${skillName} din portofoliul tău?`,
            type: 'danger',
            confirmText: 'Șterge',
            onConfirm: async () => {
                setAlertVisible(false);
                try {
                    const response = await fetch(`${API_URL}/api/cv/skill/${encodeURIComponent(skillName)}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    });
                    if (response.ok) {
                        setSkills(prev => prev.filter(s => s.name !== skillName));
                        fetchData();
                    } else {
                        showAlert({ title: 'Eroare', message: 'Nu s-a putut șterge competența.', type: 'danger' });
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleRemoveImage = async () => {
        showAlert({
            title: "Ștergere Poză",
            message: "Ești sigur că vrei să elimini fotografia de profil?",
            type: 'danger',
            confirmText: 'Șterge',
            onConfirm: async () => {
                setAlertVisible(false);
                setUpdating(true);
                try {
                    await fetch(`${API_URL}/api/auth/update-profile-image`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.token}`
                        },
                        body: JSON.stringify({ image: null })
                    });
                    setUser({ ...user, profileImage: null });
                } catch (error) {
                    console.error(error);
                } finally {
                    setUpdating(false);
                }
            }
        });
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setUpdating(true);
            try {
                await fetch(`${API_URL}/api/auth/update-profile-image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({ image: base64Image })
                });
                setUser({ ...user, profileImage: base64Image });
            } catch (error) {
                console.error(error);
            } finally {
                setUpdating(false);
            }
        }
    };



    const handleSaveProfile = async () => {
        if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
            showAlert({ title: 'Atenție', message: 'Te rugăm să completezi câmpurile obligatorii.', type: 'warning' });
            return;
        }

        const isSensitive = editEmail !== user.email || newPassword;
        if (isSensitive && !currentPassword) {
            showAlert({ title: 'Atenție', message: 'Te rugăm să introduci parola curentă pentru a confirma modificările sensibile.', type: 'warning' });
            return;
        }

        setUpdating(true);
        try {
            const body = { 
                firstName: editFirstName, 
                lastName: editLastName,
                email: editEmail
            };
            if (newPassword) body.newPassword = newPassword;
            if (currentPassword) body.currentPassword = currentPassword;

            const response = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (response.ok) {
                setUser({ ...user, ...data.user });
                setProfileModalVisible(false);
                setNewPassword('');
                setCurrentPassword('');
                showAlert({ title: 'Succes', message: 'Profilul a fost actualizat.', type: 'info' });
            } else {
                showAlert({ title: 'Eroare', message: data.error || 'Nu s-au putut salva datele.', type: 'danger' });
            }
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Eroare', message: 'Problemă de conexiune la server.', type: 'danger' });
        } finally {
            setUpdating(false);
        }
    };

    const handleResetCV = async () => {
        showAlert({
            title: "Ștergere CV",
            message: "Ești sigur că vrei să ștergi CV-ul și toate skill-urile extrase? Vei putea încărca unul nou din pagina Acasă.",
            type: 'danger',
            confirmText: 'Șterge',
            onConfirm: async () => {
                setAlertVisible(false);
                try {
                    const res = await fetch(`${API_URL}/api/cv/reset`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    });
                    if (res.ok) {
                        setUser({ ...user, cvText: null });
                        setSkills([]);
                        // Navigăm la tab-ul Home astfel încât formularul de upload să apară
                        router.replace('/(tabs)/home');
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        });
    };

    const handleUploadCV = () => {
        // Navigăm la Home unde se află formularul de upload
        router.replace('/(tabs)/home');
    };

    if (!user) return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header / Avatar Section */}
            <View style={styles.header}>
                <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={user.profileImage ? handleRemoveImage : handlePickImage}
                        disabled={updating}
                    >
                        {user.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                        ) : (
                            <LinearGradient
                                colors={['#818cf8', '#6366f1']}
                                style={styles.avatarGradient}
                            >
                                <Text style={styles.avatarText}>
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </Text>
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickImage} disabled={updating}>
                        {updating ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="camera" size={18} color="white" />}
                    </TouchableOpacity>
                </View>

                <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            {/* CV Status Card */}
            {user.cvText ? (
                <View style={styles.statusCard}>
                    <LinearGradient
                        colors={['rgba(99, 102, 241, 0.05)', 'rgba(99, 102, 241, 0.1)']}
                        style={styles.statusGradient}
                    >
                        <View style={styles.statusIconBox}>
                            <Ionicons name="shield-checkmark" size={24} color="#6366f1" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusTitle}>Profil Verificat</Text>
                            <Text style={styles.statusSubtitle}>Date extrase din CV-ul tău</Text>
                        </View>
                        <TouchableOpacity onPress={handleResetCV} style={styles.statusDeleteBtn}>
                            <View style={{ alignItems: 'center', gap: 2 }}>
                                <Ionicons name="refresh-circle" size={28} color="#94a3b8" />
                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700' }}>Înlocuiește</Text>
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            ) : (
                <TouchableOpacity
                    onPress={handleUploadCV}
                    style={[styles.statusCard, { borderColor: '#c7d2fe', borderStyle: 'dashed' }]}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['rgba(99, 102, 241, 0.03)', 'rgba(99, 102, 241, 0.07)']}
                        style={styles.statusGradient}
                    >
                        <View style={[styles.statusIconBox, { backgroundColor: '#eef2ff' }]}>
                            <Ionicons name="cloud-upload-outline" size={24} color="#6366f1" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusTitle}>Niciun CV încărcat</Text>
                            <Text style={styles.statusSubtitle}>Apasă pentru a-ți încărca CV-ul</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#6366f1" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* TABS Navigation */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'skills' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('skills')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="flash" size={18} color={activeTab === 'skills' ? '#6366f1' : '#94a3b8'} />
                    <Text style={[styles.tabText, activeTab === 'skills' && styles.tabTextActive]}>
                        Competențe ({skills.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'courses' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('courses')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="bookmark" size={18} color={activeTab === 'courses' ? '#6366f1' : '#94a3b8'} />
                    <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>
                        Salvate ({savedCourses.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* TAB CONTENT: SKILLS */}
            {activeTab === 'skills' && (
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Portofoliu Competențe</Text>
                        {skills.length > 6 && (
                            <TouchableOpacity onPress={() => setSkillsExpanded(!skillsExpanded)}>
                                <Text style={styles.seeMoreText}>{skillsExpanded ? 'Restrânge' : 'Vezi tot'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={styles.skillsGrid}>
                        {skills.length > 0 ? (
                            (skillsExpanded ? skills : skills.slice(0, 6)).map((s, index) => (
                                <View key={index} style={styles.skillItem}>
                                    <View style={styles.skillIconArea}>
                                        <View style={[styles.skillDot, { backgroundColor: s.level === 'Advanced' ? '#22c55e' : s.level === 'Intermediate' ? '#6366f1' : '#f59e0b' }]} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.skillNameText} numberOfLines={1}>{s.name}</Text>
                                        <Text style={[styles.skillLevelLabel, { color: s.level === 'Advanced' ? '#16a34a' : s.level === 'Intermediate' ? '#4f46e5' : '#d97706' }]}>
                                            {s.level === 'Advanced' ? 'Avansat' : s.level === 'Intermediate' ? 'Intermediar' : 'Începător'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteSkill(s.name)} style={{ padding: 6 }}>
                                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
                                <Text style={styles.emptyText}>Încarcă un CV pentru a-ți vizualiza competențele profesionale.</Text>
                            </View>
                        )}
                    </View>

                    {/* Quick Add Custom Skill UI in Profile */}
                    <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', position: 'relative', zIndex: 100 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Adaugă Manual O Competență</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View style={{ flex: 1, position: 'relative' }}>
                                <TextInput
                                    style={{ backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b' }}
                                    placeholder="Caută sau introdu o competență (ex: Docker)"
                                    value={newSkill}
                                    onChangeText={setNewSkill}
                                    placeholderTextColor="#94a3b8"
                                />

                                {/* Suggestions Dropdown */}
                                {suggestions.length > 0 && (
                                    <View style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: 0,
                                        right: 0,
                                        backgroundColor: 'white',
                                        borderRadius: 16,
                                        marginBottom: 8,
                                        borderWidth: 1,
                                        borderColor: '#e2e8f0',
                                        shadowColor: '#000',
                                        shadowOpacity: 0.1,
                                        shadowRadius: 10,
                                        elevation: 20,
                                        zIndex: 9999,
                                        maxHeight: 180,
                                        overflow: 'hidden'
                                    }}>
                                        <ScrollView
                                            nestedScrollEnabled={true}
                                            keyboardShouldPersistTaps="always"
                                        >
                                            {suggestions.map((s, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    onPress={() => {
                                                        setNewSkill(s);
                                                        setSuggestions([]);
                                                    }}
                                                    style={{
                                                        padding: 14,
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#f1f5f9'
                                                    }}
                                                >
                                                    <Text style={{ color: '#1e293b', fontSize: 14, fontWeight: '600' }}>{s}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={handleAddCustomSkill}
                                disabled={addingSkill}
                                style={{ backgroundColor: '#6366f1', borderRadius: 16, paddingHorizontal: 20, justifyContent: 'center', opacity: addingSkill ? 0.7 : 1, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
                            >
                                <Ionicons name="add" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* TAB CONTENT: COURSES */}
            {activeTab === 'courses' && (
                <View style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Cursuri Programate</Text>
                    {savedCourses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="bookmark-outline" size={40} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Niciun curs salvat. Adaugă-le direct din tab-ul Roadmap.</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 8 }}>
                            {savedCourses.map((course) => (
                                <View key={course.id} style={styles.courseItem}>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => Linking.openURL(course.link)} activeOpacity={0.7}>
                                        <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                                        <Text style={styles.coursePlatform}>{course.platform}</Text>
                                    </TouchableOpacity>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity
                                            onPress={() => openPromoteSkillModal(course)}
                                            style={{ padding: 10, backgroundColor: '#dcfce7', borderRadius: 12, marginLeft: 8 }}
                                        >
                                            <Ionicons name="checkmark-done" size={18} color="#16a34a" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={async () => {
                                                try {
                                                    await fetch(`${API_URL}/api/careers/unsave-course`, {
                                                        method: 'DELETE',
                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                                                        body: JSON.stringify({ courseId: course.id })
                                                    });
                                                    setSavedCourses(prev => prev.filter(c => c.id !== course.id));
                                                } catch (e) { console.error(e); }
                                            }}
                                            style={{ padding: 10, backgroundColor: '#fee2e2', borderRadius: 12, marginLeft: 8 }}
                                        >
                                            <Ionicons name="trash" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Settings Menu */}
            <View style={[styles.sectionCard, { marginTop: 10 }]}>
                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Setări Cont</Text>
                
                <TouchableOpacity 
                    style={styles.menuListItem}
                    onPress={() => {
                        setEditFirstName(user?.firstName);
                        setEditLastName(user?.lastName);
                        setEditEmail(user?.email);
                        setNewPassword('');
                        setCurrentPassword('');
                        setProfileModalVisible(true);
                    }}
                >
                    <View style={[styles.menuIconCircle, { backgroundColor: '#e0e7ff' }]}>
                        <Ionicons name="person" size={20} color="#6366f1" />
                    </View>
                    <Text style={styles.menuListText}>Date Personale</Text>
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>

                <View style={styles.menuSeparator} />

                <TouchableOpacity onPress={logout} style={styles.menuListItem}>
                    <View style={[styles.menuIconCircle, { backgroundColor: '#fee2e2' }]}>
                        <Ionicons name="log-out" size={20} color="#ef4444" />
                    </View>
                    <Text style={[styles.menuListText, { color: '#ef4444', fontWeight: '800' }]}>Deconectare</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.footerInfo}>Versiune Proiect Licență v1.1.0 • 2024</Text>



            {/* Modal Promote Skill */}
            <Modal
                visible={promoteModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPromoteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Curs Asimilat!</Text>
                            <Text style={styles.modalSubtitle}>Alege competența pe care simți că ai dobândit-o sau îmbunătățit-o cu acest curs:</Text>
                        </View>

                        <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
                            {skills.length > 0 ? skills.map((s, idx) => (
                                <TouchableOpacity 
                                    key={idx} 
                                    style={{ padding: 16, backgroundColor: '#f0fdf4', borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#bcf0da', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                    onPress={() => handlePromoteSkill(s)}
                                >
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#166534' }}>{s.name}</Text>
                                        <Text style={{ fontSize: 12, color: '#15803d' }}>
                                            Nivel curent: {s.level === 'Advanced' ? 'Avansat' : s.level === 'Intermediate' ? 'Intermediar' : 'Începător'}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 15, color: '#16a34a', fontWeight: '900' }}>
                                        {s.level === 'Advanced' ? '✅ Max' : s.level === 'Intermediate' ? '➜ Avansat' : '➜ Intermediar'}
                                    </Text>
                                </TouchableOpacity>
                            )) : (
                                <Text style={{ color: '#64748b', textAlign: 'center', marginVertical: 20 }}>Nu ai adăugat competențe în portofoliu încă.</Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity 
                            style={styles.modalCloseBtn}
                            onPress={() => setPromoteModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>Renunță</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Edit Profile */}
            <Modal
                visible={isProfileModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setProfileModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '85%', paddingBottom: 20 }]}>
                        <TouchableOpacity 
                            style={styles.closeHeaderBtn} 
                            onPress={() => setProfileModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                        
                        <View style={[styles.modalHeader, { marginBottom: 20 }]}>
                            <View style={styles.modalIconCircle}>
                                <Ionicons name="person-circle-outline" size={32} color="#6366f1" />
                            </View>
                            <Text style={[styles.modalTitle, { fontSize: 24, marginBottom: 4 }]}>Profilul tău</Text>
                            <Text style={styles.modalSubtitle}>Modifică datele de identificare</Text>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 24 }}>
                            <View style={{ gap: 16 }}>
                                <View>
                                    <Text style={styles.inputLabel}>Prenume</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.modalInputFlat}
                                            value={editFirstName}
                                            onChangeText={setEditFirstName}
                                            placeholder="Prenume"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text style={styles.inputLabel}>Nume</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.modalInputFlat}
                                            value={editLastName}
                                            onChangeText={setEditLastName}
                                            placeholder="Nume"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.modalInputFlat}
                                            value={editEmail}
                                            onChangeText={setEditEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            placeholder="email@exemplu.com"
                                        />
                                    </View>
                                </View>

                                <View style={{ marginTop: 8, padding: 16, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <Text style={styles.inputLabel}>Confirmă cu Parola Actuală</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: 'white', borderRadius: 20, borderWidth: 1.5, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 }]}>
                                        <Ionicons name="shield-outline" size={18} color="#6366f1" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.modalInputFlat}
                                            value={currentPassword}
                                            onChangeText={setCurrentPassword}
                                            secureTextEntry={!showCurrentPassword}
                                            placeholder="Parola ta actuală"
                                        />
                                        <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeBtn}>
                                            <Ionicons name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#94a3b8" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View>
                                    <Text style={styles.inputLabel}>Parolă Nouă</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.modalInputFlat}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showNewPassword}
                                            placeholder="Minim 6 caractere"
                                        />
                                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                                            <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#94a3b8" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity 
                                style={[styles.modalCloseBtn, { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', height: 56, justifyContent: 'center', borderRadius: 20 }]}
                                onPress={() => setProfileModalVisible(false)}
                            >
                                <Text style={[styles.modalCloseText, { color: '#64748b' }]}>Anulează</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={{ flex: 1.5, borderRadius: 20, overflow: 'hidden' }}
                                onPress={handleSaveProfile}
                                disabled={updating}
                            >
                                <LinearGradient
                                    colors={['#6366f1', '#4f46e5']}
                                    style={{ height: 56, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    {updating ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Salvează Tot</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <CustomAlert 
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertVisible(false)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f1f5f9',
        borderWidth: 4,
        borderColor: 'white',
        shadowColor: '#6366f1',
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
        overflow: 'hidden',
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 48,
        fontWeight: '900',
        color: 'white',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#1e293b',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        marginTop: 16,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 4,
    },
    statusCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.1)',
    },
    statusGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    statusIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1e293b',
    },
    statusSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366f1',
        opacity: 0.8,
    },
    statusDeleteBtn: {
        padding: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        gap: 8,
    },
    tabButtonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94a3b8',
    },
    tabTextActive: {
        color: '#6366f1',
        fontWeight: '800',
    },
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
    },
    seeMoreText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#6366f1',
    },
    skillsGrid: {
        gap: 10,
    },
    skillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 12,
    },
    skillIconArea: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    skillDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    skillNameText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1e293b',
    },
    skillLevelLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 1,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    courseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 8,
    },
    courseTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1e293b',
        lineHeight: 18,
    },
    coursePlatform: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6366f1',
        marginTop: 2,
    },
    menuListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 16,
    },
    menuIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuListText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#475569',
    },
    menuSeparator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    footerInfo: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#cbd5e1',
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 32,
        paddingBottom: 48,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1e293b',
    },
    modalSubtitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6366f1',
        marginTop: 4,
    },
    closeHeaderBtn: {
        position: 'absolute',
        top: 24,
        right: 24,
        zIndex: 10,
        padding: 4,
    },
    levelOptionsList: {
        gap: 12,
        marginBottom: 32,
    },
    levelOptionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#f1f5f9',
        gap: 16,
    },
    levelOptionActive: {
        borderColor: '#6366f1',
        backgroundColor: 'white',
    },
    levelOptionDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    levelOptionLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
    },
    levelOptionDesc: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 2,
    },
    modalCloseBtn: {
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#94a3b8',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginLeft: 4,
    },
    modalIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    modalInputFlat: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '600',
    },
    eyeBtn: {
        padding: 8,
    },
});
