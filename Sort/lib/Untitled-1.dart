import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../dpr/dpr_dashboard_screen.dart';
import '../dpr/dpr_list_screen.dart';
import '../dpr/risk_prediction_screen.dart';

// Placeholder for screens to be built in Phase 2
class AiRecommendationsPlaceholder extends StatelessWidget {
  const AiRecommendationsPlaceholder({super.key});
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
        body: Center(child: Text('AI Recommendations Coming Soon')));
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;
  final List<Widget> _screens = [
    DprDashboardScreen(),
    DprListScreen(),
    const AiRecommendationsPlaceholder(), // Will be AiRecommendationsScreen
    RiskPredictionScreen(),
    const Center(child: Text('More Options')), // Will be Settings/More
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.folder_open_outlined),
            activeIcon: Icon(Icons.folder_open),
            label: 'DPR Queue',
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
            activeIcon: Icon(Icons.more_horiz),
            label: 'More',
          ),
        ],
      ),
    );
  }
}
