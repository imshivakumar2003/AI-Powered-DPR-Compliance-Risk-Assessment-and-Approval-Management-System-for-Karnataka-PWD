import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../dpr/dpr_dashboard_screen.dart';
import '../dpr/dpr_list_screen.dart';
import '../dpr/risk_prediction_screen.dart';
import '../dpr/ai_recommendations_screen.dart';
import '../dpr/approvals_screen.dart';
import '../risk/risk_alerts_screen.dart';
import '../analytics/analytics_screen.dart';
import '../settings/settings_screen.dart';
import '../admin/user_management_screen.dart';
import '../auth/login_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = [
    const DprDashboardScreen(),
    const DprListScreen(),
    const AiRecommendationsScreen(),
    const RiskPredictionWidget(projectName: 'Smart City'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: _buildDrawer(),
      body: _selectedIndex < _screens.length 
          ? _screens[_selectedIndex] 
          : const SizedBox.shrink(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          if (index == 4) {
            _scaffoldKey.currentState?.openDrawer();
          } else {
            setState(() => _selectedIndex = index);
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.folder_open_outlined),
            activeIcon: Icon(Icons.folder_open),
            label: 'Queue',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.lightbulb_outline),
            activeIcon: Icon(Icons.lightbulb),
            label: 'AI Recs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.warning_amber_outlined),
            activeIcon: Icon(Icons.warning_amber),
            label: 'Risk Map',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz),
            label: 'More',
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: AppTheme.bgPrimary,
      child: Column(
        children: [
          _buildDrawerHeader(),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _drawerSection('Intelligence'),
                _drawerItem(Icons.bar_chart, 'Analytics', () => _nav(const AnalyticsScreen())),
                _drawerItem(Icons.shield_outlined, 'Risk Alerts', () => _nav(const RiskAlertsScreen())),
                _drawerItem(Icons.lightbulb_outline, 'Recommendations', () => setState(() { _selectedIndex = 2; Navigator.pop(context); })),
                
                const Divider(),
                _drawerSection('Administration'),
                _drawerItem(Icons.check_circle_outline, 'Approvals', () => _nav(const ApprovalsScreen())),
                _drawerItem(Icons.people_outline, 'User Management', () => _nav(const UserManagementScreen())),
                _drawerItem(Icons.settings_outlined, 'Settings', () => _nav(const SettingsScreen())),
              ],
            ),
          ),
          const Divider(),
          _drawerItem(Icons.logout, 'Logout', () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => LoginScreen()),
              (route) => false,
            );
          }),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildDrawerHeader() {
    return DrawerHeader(
      decoration: const BoxDecoration(color: AppTheme.bgSecondary),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CircleAvatar(
            backgroundColor: AppTheme.accentBlue,
            child: Text('RS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 12),
          const Text('Rajiv Sharma', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const Text('MDoNER Director', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        ],
      ),
    );
  }

  Widget _drawerSection(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.accentBlue, letterSpacing: 1)),
    );
  }

  Widget _drawerItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, size: 20, color: AppTheme.textSecondary),
      title: Text(title, style: const TextStyle(fontSize: 14)),
      onTap: onTap,
    );
  }

  void _nav(Widget screen) {
    Navigator.pop(context);
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }
}
