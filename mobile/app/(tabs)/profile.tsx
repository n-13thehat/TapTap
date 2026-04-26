import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Settings,
  Music,
  Heart,
  Users,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const stats = [
    { label: 'Tracks', value: '24' },
    { label: 'Followers', value: '1.2K' },
    { label: 'Following', value: '342' },
  ];

  const menuSections = [
    {
      title: 'Content',
      items: [
        { icon: Music, label: 'My Music', onPress: () => router.push('/(tabs)/music') },
        { icon: Heart, label: 'Liked Songs', onPress: () => {} },
        { icon: Users, label: 'Following', onPress: () => {} },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: Bell, label: 'Notifications', toggle: true, value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: Lock, label: 'Privacy & Security', onPress: () => {} },
        { icon: Settings, label: 'App Settings', onPress: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', onPress: () => {} },
        { icon: LogOut, label: 'Log Out', onPress: logout, danger: true },
      ],
    },
  ];

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User color="#8B5CF6" size={48} />
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Edit color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.handle}>@{user?.handle || 'guest'}</Text>
            
            {user?.bio && (
              <Text style={styles.bio}>{user.bio}</Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay((sectionIndex + 1) * 100)}
            style={styles.menuSection}
          >
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuItems}>
              {section.items.map((item, itemIndex) => (
                <MenuItem key={itemIndex} item={item} />
              ))}
            </View>
          </Animated.View>
        ))}

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.version}>TapTap Matrix v1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function MenuItem({ item }: any) {
  const Icon = item.icon;
  
  if (item.toggle) {
    return (
      <View style={styles.menuItem}>
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuItemIcon, item.danger && styles.menuItemIconDanger]}>
            <Icon color={item.danger ? '#EF4444' : '#8B5CF6'} size={20} />
          </View>
          <Text style={[styles.menuItemLabel, item.danger && styles.menuItemLabelDanger]}>
            {item.label}
          </Text>
        </View>
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#8B5CF6' }}
          thumbColor="#FFFFFF"
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuItemIcon, item.danger && styles.menuItemIconDanger]}>
          <Icon color={item.danger ? '#EF4444' : '#8B5CF6'} size={20} />
        </View>
        <Text style={[styles.menuItemLabel, item.danger && styles.menuItemLabelDanger]}>
          {item.label}
        </Text>
      </View>
      <ChevronRight color="rgba(255, 255, 255, 0.4)" size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 3,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  handle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  editProfileButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItems: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuItemLabelDanger: {
    color: '#EF4444',
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

