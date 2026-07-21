import 'package:flutter/material.dart';

class UserManagementScreen extends StatefulWidget {
  @override
  _UserManagementScreenState createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  // Mock list of users
  List<Map<String, dynamic>> _users = [
    {'id': '1', 'name': 'John Doe', 'email': 'john@example.com', 'role': 'User', 'status': 'Active'},
    {'id': '2', 'name': 'Jane Smith', 'email': 'jane@example.com', 'role': 'Admin', 'status': 'Active'},
    {'id': '3', 'name': 'Bob Wilson', 'email': 'bob@example.com', 'role': 'User', 'status': 'Suspended'},
  ];

  void _deleteUser(String id) {
    setState(() {
      _users.removeWhere((user) => user['id'] == id);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('User deleted successfully')),
    );
  }

  void _editUserRole(String id, String currentRole) {
    String newRole = currentRole == 'Admin' ? 'User' : 'Admin';
    setState(() {
      final index = _users.indexWhere((user) => user['id'] == id);
      if (index != -1) {
        _users[index]['role'] = newRole;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('User role updated to $newRole')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('User Management'),
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            onPressed: () {
              // Show dialog to add a new user manually
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Add User feature coming soon')),
              );
            },
            tooltip: 'Add User',
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: _users.length,
        itemBuilder: (context, index) {
          final user = _users[index];
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: user['status'] == 'Active' ? Colors.blue : Colors.grey,
                child: Text(user['name'][0]),
              ),
              title: Text(user['name']),
              subtitle: Text('${user['email']} • ${user['role']}'),
              trailing: PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'edit_role') {
                    _editUserRole(user['id'], user['role']);
                  } else if (value == 'delete') {
                    _deleteUser(user['id']);
                  }
                },
                itemBuilder: (BuildContext context) {
                  return [
                    PopupMenuItem(
                      value: 'edit_role',
                      child: Text('Toggle Role (Admin/User)'),
                    ),
                    PopupMenuItem(
                      value: 'delete',
                      child: Text('Delete User', style: TextStyle(color: Colors.red)),
                    ),
                  ];
                },
              ),
            ),
          );
        },
      ),
    );
  }
}
