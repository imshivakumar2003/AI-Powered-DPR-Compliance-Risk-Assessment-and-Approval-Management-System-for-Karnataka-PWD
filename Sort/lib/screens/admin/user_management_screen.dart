import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final List<Map<String, dynamic>> _users = [
    {'id': '1', 'name': 'John Doe', 'email': 'john@example.com', 'role': 'User', 'status': 'Active'},
    {'id': '2', 'name': 'Jane Smith', 'email': 'jane@example.com', 'role': 'Admin', 'status': 'Active'},
    {'id': '3', 'name': 'Bob Wilson', 'email': 'bob@example.com', 'role': 'User', 'status': 'Suspended'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [
          IconButton(icon: const Icon(Icons.person_add_alt_1_outlined), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search by name or email...',
                prefixIcon: Icon(Icons.search, size: 20),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _users.length,
              itemBuilder: (context, index) {
                final user = _users[index];
                return _buildUserCard(user);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user) {
    final isActive = user['status'] == 'Active';
    final isAdmin = user['role'] == 'Admin';
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isAdmin ? AppTheme.accentPurple : AppTheme.accentBlue,
          child: Text(user['name'][0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
        title: Text(user['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(user['email'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildBadge(user['role'], isAdmin ? AppTheme.accentPurple : AppTheme.textMuted),
            const SizedBox(width: 8),
            _buildBadge(user['status'], isActive ? AppTheme.accentGreen : AppTheme.accentRed),
            const SizedBox(width: 4),
            IconButton(icon: const Icon(Icons.more_vert, size: 20, color: AppTheme.textMuted), onPressed: () {}),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }
}
