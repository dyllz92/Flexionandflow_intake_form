const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

let uuidv4;
async function getUuidV4() {
    if (!uuidv4) {
        const uuidModule = await import('uuid');
        uuidv4 = uuidModule.v4;
    }
    return uuidv4;
}

/**
 * UserStore - Manages user accounts for Analytics Dashboard
 * Stores users in JSON file: utils/users.json
 */
class UserStore {
    constructor(usersFile = path.join(__dirname, 'users.json')) {
        this.usersFile = usersFile;
        this.BCRYPT_ROUNDS = 12;
    }

    /**
     * Load users from file
     */
    async loadUsers() {
        try {
            const data = await fs.readFile(this.usersFile, 'utf-8');
            const parsed = JSON.parse(data);
            return parsed.users || [];
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    /**
     * Save users to file
     */
    async saveUsers(users) {
        const data = { users: users, lastUpdated: new Date().toISOString() };
        await fs.writeFile(this.usersFile, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Generate a UUID (v4)
     */
    async generateUuid() {
        const v4 = await getUuidV4();
        return v4();
    }

    /**
     * Create a new user account
     */
    async createUser(email, firstName, lastName, dateOfBirth, password, role = 'manager') {
        // Validate inputs
        if (!this.validateEmail(email)) {
            throw new Error('Invalid email address');
        }
        if (!this.validateFirstName(firstName)) {
            throw new Error('First name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes');
        }
        if (!this.validateLastName(lastName)) {
            throw new Error('Last name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes');
        }
        if (!this.validateDateOfBirth(dateOfBirth)) {
            throw new Error('Date of birth must be a valid date (YYYY-MM-DD format)');
        }
        if (!this.validatePassword(password)) {
            throw new Error('Password must be at least 8 characters, containing uppercase and lowercase letters');
        }

        const users = await this.loadUsers();

        // Check for duplicates
        if (users.some(u => u.email === email && u.status !== 'rejected')) {
            throw new Error('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

        // Create user
        const newUser = {
            id: await this.generateUuid(),
            email,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth: dateOfBirth.trim(),
            passwordHash,
            role,
            status: 'pending',
            createdAt: new Date().toISOString(),
            approvedAt: null,
            approvedBy: null,
            lastLoginAt: null
        };

        users.push(newUser);
        await this.saveUsers(users);

        return { id: newUser.id, email, firstName: newUser.firstName, lastName: newUser.lastName, dateOfBirth: newUser.dateOfBirth, status: 'pending' };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const users = await this.loadUsers();
        return users.find(u => u.id === userId);
    }


    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        const users = await this.loadUsers();
        return users.find(u => u.email === email && u.status !== 'rejected');
    }

    /**
     * Get all users
     */
    async getAllUsers() {
        return this.loadUsers();
    }

    /**
     * Get pending user registrations
     */
    async getPendingUsers() {
        const users = await this.loadUsers();
        return users.filter(u => u.status === 'pending');
    }

    /**
     * Verify password for a user
     */
    async verifyPassword(userId, password) {
        const user = await this.getUserById(userId);
        if (!user) return false;

        return bcrypt.compare(password, user.passwordHash);
    }

    /**
     * Update user status (pending → approved/rejected)
     */
    async updateUserStatus(userId, status, approvedBy = null) {
        if (!['approved', 'rejected'].includes(status)) {
            throw new Error('Invalid status');
        }

        const users = await this.loadUsers();
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.status = status;
        if (status === 'approved') {
            user.approvedAt = new Date().toISOString();
            user.approvedBy = approvedBy;
        }

        await this.saveUsers(users);
        return user;
    }

    /**
     * Delete a rejected user (allows re-registration with same email)
     */
    async deleteRejectedUser(email) {
        const users = await this.loadUsers();
        const filtered = users.filter(u => !(u.email === email && u.status === 'rejected'));
        await this.saveUsers(filtered);
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin(userId) {
        const users = await this.loadUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.lastLoginAt = new Date().toISOString();
            await this.saveUsers(users);
        }
    }

    /**
     * Ensure admin account exists, create if missing
     */
    async ensureAdminExists() {
        const users = await this.loadUsers();
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.local';
        const adminExists = users.some(u => u.email === adminEmail);

        if (!adminExists) {
            const adminPassword = process.env.ADMIN_PASSWORD;

            if (!adminPassword) {
                throw new Error('ADMIN_PASSWORD environment variable not set');
            }

            const passwordHash = await bcrypt.hash(adminPassword, this.BCRYPT_ROUNDS);
            const adminUser = {
                id: await this.generateUuid(),
                email: adminEmail,
                firstName: 'Admin',
                lastName: 'User',
                dateOfBirth: '1990-01-01',
                passwordHash,
                role: 'admin',
                status: 'approved',
                createdAt: new Date().toISOString(),
                approvedAt: new Date().toISOString(),
                approvedBy: null,
                lastLoginAt: null
            };

            users.push(adminUser);
            await this.saveUsers(users);
            console.log(`✓ Admin account created: ${adminEmail}`);
        }
    }

    /**
     * Validate first name format
     */
    validateFirstName(firstName) {
        if (!firstName || firstName.trim().length < 2 || firstName.trim().length > 50) return false;
        return /^[a-zA-Z\s'-]+$/.test(firstName.trim());
    }

    /**
     * Validate last name format
     */
    validateLastName(lastName) {
        if (!lastName || lastName.trim().length < 2 || lastName.trim().length > 50) return false;
        return /^[a-zA-Z\s'-]+$/.test(lastName.trim());
    }

    /**
     * Validate date of birth format (YYYY-MM-DD)
     */
    validateDateOfBirth(dateOfBirth) {
        if (!dateOfBirth) return false;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateOfBirth)) return false;

        // Validate the date is actually valid
        const date = new Date(dateOfBirth);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        if (!email || email.length > 254) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * Min 8 chars, must contain uppercase and lowercase
     * Optional: number or special character for additional strength
     */
    validatePassword(password) {
        if (!password || password.length < 8) return false;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        return hasUppercase && hasLowercase;
    }

    /**
     * Check if user can log in (must be approved)
     */
    async canLogin(userId) {
        const user = await this.getUserById(userId);
        return user && user.status === 'approved';
    }
}

module.exports = UserStore;
