import '../models/user_model.dart';

class AuthService {
  // Mock login function
  Future<UserModel?> login(String email, String password) async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 2));

    if (email == 'admin@example.com' && password == 'admin123') {
      return UserModel(
        id: 'admin-1',
        email: email,
        firstName: 'System',
        lastName: 'Admin',
        token: 'mock-jwt-admin-token',
      );
    } else if (email == 'user@example.com' && password == 'password123') {
      return UserModel(
        id: 'user-1',
        email: email,
        firstName: 'John',
        lastName: 'Doe',
        token: 'mock-jwt-user-token',
      );
    }
    return null; // Login failed
  }

  // Mock register function
  Future<UserModel?> register(
      String email, String password, String firstName, String lastName) async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 2));

    // Simulate successful registration
    return UserModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      email: email,
      firstName: firstName,
      lastName: lastName,
      token: 'mock-jwt-new-user-token',
    );
  }

  // Mock logout
  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 500));
    // Here you would clear shared preferences or secure storage
  }

  // Function to check if token is valid (mock)
  Future<bool> checkSession() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return false; // Assuming no active session for demonstration
  }
}
