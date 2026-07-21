import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../auth/login_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings & Profile'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildProfileCard(),
          const SizedBox(height: 24),
          _buildSectionHeader('App Preferences'),
          _buildSettingTile(Icons.dark_mode_outlined, 'Dark Mode', trailing: Switch(value: true, onChanged: (v) {})),
          _buildSettingTile(Icons.notifications_none, 'Push Notifications', trailing: Switch(value: true, onChanged: (v) {})),
          _buildSettingTile(Icons.language, 'Language', trailing: const Text('English (IN)', style: TextStyle(fontSize: 12, color: AppTheme.textMuted))),
          
          const SizedBox(height: 24),
          _buildSectionHeader('Support & Legal'),
          _buildSettingTile(Icons.help_outline, 'Help Center'),
          _buildSettingTile(Icons.privacy_tip_outlined, 'Privacy Policy'),
          _buildSettingTile(Icons.info_outline, 'About DPR·AI'),
          
          const SizedBox(height: 32),
          _buildAboutBanner(),
          
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentRed),
          ),
          const SizedBox(height: 24),
          const Center(child: Text('Version 1.0.0 (Build 124)', style: TextStyle(fontSize: 10, color: AppTheme.textMuted))),
        ],
      ),
    );
  }

  Widget _buildProfileCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const CircleAvatar(
              radius: 30,
              backgroundColor: AppTheme.accentBlue,
              child: Text('RS', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
            const SizedBox(width: 16),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Rajiv Sharma', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text('MDoNER Director', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ),
            const Spacer(),
            IconButton(icon: const Icon(Icons.edit_outlined, size: 20), onPressed: () {}),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.accentBlue, letterSpacing: 1)),
    );
  }

  Widget _buildSettingTile(IconData icon, String title, {Widget? trailing}) {
    return ListTile(
      leading: Icon(icon, size: 22, color: AppTheme.textSecondary),
      title: Text(title, style: const TextStyle(fontSize: 14)),
      trailing: trailing ?? const Icon(Icons.chevron_right, size: 20, color: AppTheme.textMuted),
      onTap: () {},
    );
  }

  Widget _buildAboutBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.accentBlue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: const Column(
        children: [
          Text('🏆 SIH 2025 Winner', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentAmber)),
          SizedBox(height: 4),
          Text('Team NEXUS · IIIT Bangalore', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          SizedBox(height: 8),
          Text('Automated Quality Assessment Platform for MDoNER', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}
