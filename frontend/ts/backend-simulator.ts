// Backend Simulator for AI Interviewer
import type { Session, SessionResult, Progress, Stats, Question } from './types.js';

interface SimulatorData {
  users: any[];
  sessions: Session[];
  progress: Progress[];
  questions: Question[];
}

interface UserData {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  lastLoginAt?: string;
  preferences?: any;
}

interface SessionData {
  userId: string;
  sessionType?: string;
  topic: string;
  difficulty: string;
  timeLimit: number;
  questions?: string[];
}

declare global {
  interface Window {
    BackendSimulator: typeof BackendSimulator;
  }
}

class BackendSimulator {
  private data: SimulatorData;

  constructor() {
    this.data = {
      users: [],
      sessions: [],
      progress: [],
      questions: []
    };
    this.initializeData();
  }

  async initializeData(): Promise<void> {
    try {
      // Load data from JSON files
      const [usersData, sessionsData, progressData, questionsData, neetcodeData] = await Promise.all([
        this.loadJSON('data/users.json'),
        this.loadJSON('data/sessions.json'),
        this.loadJSON('data/progress.json'),
        this.loadJSON('data/data-structures.json'),
        this.loadJSON('data/neetcode-75.json').catch(() => ({})) // Load NeetCode, but don't fail if missing
      ]);

      this.data.users = usersData.users || [];
      this.data.sessions = sessionsData.sessions || [];
      this.data.progress = progressData.userProgress || [];
      
      // Combine questions from data-structures.json and neetcode-75.json
      const standardQuestions = questionsData.questions?.sampleData || [];
      const neetcodeQuestions = neetcodeData.questions || [];
      this.data.questions = [...neetcodeQuestions, ...standardQuestions];
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async loadJSON(filename: string): Promise<any> {
    try {
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return {};
    }
  }

  // User Authentication Methods
  async authenticateUser(email: string, password: string): Promise<any> {
    const user = this.data.users.find((u: UserData) => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Simulate password check (in real app, this would be hashed comparison)
    if (user.password !== `hashed_${password}`) {
      throw new Error('Invalid password');
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    await this.saveData('users.json', { users: this.data.users });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      preferences: user.preferences
    };
  }

  async registerUser(userData: any): Promise<any> {
    const existingUser = this.data.users.find((u: UserData) => u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: userData.email,
      username: userData.username,
      password: `hashed_${userData.password}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profilePicture: "",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      preferences: {
        theme: "light",
        difficulty: "medium",
        topics: [],
        notifications: true,
        emailUpdates: true
      },
      subscription: {
        plan: "free",
        startDate: new Date().toISOString(),
        endDate: null,
        isActive: true
      }
    };

    this.data.users.push(newUser);
    await this.saveData('users.json', { users: this.data.users });

    return {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      preferences: newUser.preferences
    };
  }

  // Session Management Methods
  async createSession(sessionData: SessionData): Promise<Session> {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      userId: sessionData.userId,
      sessionType: (sessionData.sessionType || 'practice') as 'practice' | 'mock-interview',
      topic: sessionData.topic,
      difficulty: sessionData.difficulty as 'easy' | 'medium' | 'hard',
      timeLimit: sessionData.timeLimit,
      questions: sessionData.questions || [],
      startTime: new Date().toISOString(),
      endTime: undefined,
      totalTime: 0,
      status: 'active',
      results: [],
      score: 0,
      accuracy: 0,
      createdAt: new Date().toISOString()
    };

    this.data.sessions.push(newSession);
    await this.saveData('sessions.json', { sessions: this.data.sessions });
    return newSession;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    Object.assign(session, updates);
    await this.saveData('sessions.json', { sessions: this.data.sessions });
    return session;
  }

  async endSession(sessionId: string, results: SessionResult[]): Promise<Session> {
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.endTime = new Date().toISOString();
    session.status = 'completed';
    session.results = results;
    
    // Calculate score and accuracy
    const correctAnswers = results.filter(r => r.isCorrect).length;
    session.score = Math.round((correctAnswers / results.length) * 100);
    session.accuracy = correctAnswers / results.length;

    await this.saveData('sessions.json', { sessions: this.data.sessions });
    await this.updateUserProgress(session.userId, session);
    
    return session;
  }

  // Progress Tracking Methods
  async updateUserProgress(userId: string, session: Session): Promise<Progress> {
    const topic = session.topic;
    const difficulty = session.difficulty;
    
    let progress = this.data.progress.find(p => 
      p.userId === userId && p.topic === topic && p.difficulty === difficulty
    );

    if (!progress) {
      progress = {
        id: `progress-${Date.now()}`,
        userId: userId,
        topic: topic,
        difficulty: difficulty,
        totalAttempted: 0,
        totalCorrect: 0,
        totalTimeSpent: 0,
        averageTime: 0,
        accuracy: 0,
        streak: 0,
        lastPracticed: new Date().toISOString(),
        masteryLevel: 'beginner',
        updatedAt: new Date().toISOString()
      };
      this.data.progress.push(progress);
    }

    // Update progress based on session results
    session.results.forEach(result => {
      progress!.totalAttempted++;
      if (result.isCorrect) {
        progress!.totalCorrect++;
      }
      progress!.totalTimeSpent += result.timeSpent;
    });

    progress.accuracy = progress.totalCorrect / progress.totalAttempted;
    progress.averageTime = progress.totalTimeSpent / progress.totalAttempted;
    progress.lastPracticed = new Date().toISOString();
    progress.updatedAt = new Date().toISOString();

    // Update mastery level based on accuracy
    if (progress.accuracy >= 0.8) {
      progress.masteryLevel = 'expert';
    } else if (progress.accuracy >= 0.6) {
      progress.masteryLevel = 'advanced';
    } else if (progress.accuracy >= 0.4) {
      progress.masteryLevel = 'intermediate';
    } else {
      progress.masteryLevel = 'beginner';
    }

    await this.saveData('progress.json', { userProgress: this.data.progress });
    return progress;
  }

  async getUserProgress(userId: string): Promise<Progress[]> {
    return this.data.progress.filter(p => p.userId === userId);
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return this.data.sessions.filter(s => s.userId === userId);
  }

  async getUserStats(userId: string): Promise<Stats> {
    const sessions = await this.getUserSessions(userId);
    const progress = await this.getUserProgress(userId);

    const totalSolved = sessions.reduce((sum, session) => 
      sum + session.results.filter(r => r.isCorrect).length, 0
    );
    
    const totalTime = sessions.reduce((sum, session) => sum + session.totalTime, 0);
    
    const accuracy = sessions.length > 0 ? 
      sessions.reduce((sum, session) => sum + session.accuracy, 0) / sessions.length : 0;

    const streak = this.calculateStreak(sessions);

    return {
      totalSolved,
      totalTime,
      accuracy: Math.round(accuracy * 100),
      streak,
      progress
    };
  }

  calculateStreak(sessions: Session[]): number {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions
      .filter(s => s.status === 'completed' && s.endTime)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.endTime!);
      const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Question Management Methods
  async getQuestions(topic: string, difficulty: string, limit: number = 10): Promise<Question[]> {
    const questions = this.data.questions.filter(q => 
      q.topic === topic && q.difficulty === difficulty
    );
    
    // Shuffle and return limited number
    return this.shuffleArray(questions).slice(0, limit);
  }

  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Data Persistence Methods
  async saveData(filename: string, data: any): Promise<void> {
    // In a real application, this would save to a database
    // For this simulation, we'll use localStorage
    try {
      localStorage.setItem(`ai_interviewer_${filename}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
    }
  }

  async loadData(filename: string): Promise<any> {
    try {
      const data = localStorage.getItem(`ai_interviewer_${filename}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return null;
    }
  }
}

// Export for use in other modules
window.BackendSimulator = BackendSimulator;

