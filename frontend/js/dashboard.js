// Dashboard System for AI Interviewer
class DashboardSystem {
  constructor() {
    this.currentUser = null;
    this.userStats = null;
    this.progressChart = null;
    
    // Suppress unhandled promise rejections for expected network errors
    this.setupErrorHandling();
    
    // Initialize event listeners first (they're safe to call)
    this.initializeEventListeners();
    
    // Handle email confirmation callback from Supabase FIRST
    // This must run before checkAuthentication to handle the redirect properly
    this.handleEmailConfirmation().then(wasConfirmation => {
      if (!wasConfirmation) {
        // Normal page load - proceed with auth check
        this.checkAuthentication().then(() => {
          if (this.currentUser) {
            this.loadDashboardData();
          }
        });
      }
      // If wasConfirmation is true, handleEmailConfirmation already handled everything
    });
    
    // Reload data when page becomes visible (user returns from practice)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.currentUser) {
        console.log('Page visible again, reloading dashboard data');
        this.loadDashboardData();
      }
    });
    
    // Also reload on page focus
    window.addEventListener('focus', () => {
      if (this.currentUser) {
        console.log('Window focused, reloading dashboard data');
        this.loadDashboardData();
      }
    });
    
    // Reload when page is shown (includes back/forward navigation)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted || (this.currentUser && document.visibilityState === 'visible')) {
        console.log('Page shown, reloading dashboard data');
        this.loadDashboardData();
      }
    });
    
    // Check if we're returning from practice page
    const returningFromPractice = sessionStorage.getItem('returningFromPractice');
    if (returningFromPractice) {
      sessionStorage.removeItem('returningFromPractice');
      console.log('Returning from practice, refreshing dashboard data');
      // Wait longer for data to be saved and available, with retry
      setTimeout(async () => {
        await this.loadDashboardData();
        // Retry once more after a delay in case data wasn't immediately available
        setTimeout(async () => {
          console.log('Retrying dashboard data load after practice session');
          await this.loadDashboardData();
        }, 1500);
      }, 1000);
    }
    
    // Don't load data here - wait for email confirmation handler or auth check
  }

  async checkAuthentication() {
    // Prefer Supabase session
    if (window.getSupabaseUser && window.supabaseClient) {
      const user = await window.getSupabaseUser();
      if (!user) {
        this.showNotification('Please log in to view your dashboard.', 'warning');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        return false;
      }
      this.currentUser = this.mapSupabaseUser(user);
      return true;
    }

    // Fallback to legacy local session
    const userData = localStorage.getItem('ai_interviewer_user');
    if (!userData) {
      this.showNotification('Please log in to view your dashboard.', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return false;
    }
    this.currentUser = JSON.parse(userData);
    return true;
  }

  mapSupabaseUser(user) {
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email,
      username: meta.username || (user.email ? user.email.split('@')[0] : ''),
      firstName: meta.firstName || '',
      lastName: meta.lastName || ''
    };
  }

  async handleEmailConfirmation() {
    // Check for email confirmation callback in URL hash
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');
      const type = hashParams.get('type');
      
      // Only handle email confirmation (not other auth flows)
      if (type !== 'signup' && type !== 'email' && !accessToken) {
        return;
      }
      
      if (error) {
        // Handle confirmation errors
        let errorMessage = 'Email confirmation failed.';
        if (error === 'otp_expired') {
          errorMessage = 'The confirmation link has expired. Please request a new confirmation email from the login page.';
        } else if (error === 'access_denied') {
          errorMessage = 'Email confirmation was denied or the link is invalid.';
        } else if (errorDescription) {
          errorMessage = `Email confirmation error: ${decodeURIComponent(errorDescription)}`;
        }
        
        this.showNotification(errorMessage, 'error');
        
        // Clean up URL hash and redirect to login
        window.history.replaceState(null, '', 'login.html');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 3000);
        return true; // Indicate we handled this, don't proceed with normal load
      }
      
      if (accessToken && refreshToken && window.supabaseClient) {
        // Exchange tokens for session
        try {
          const { data, error } = await window.supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session from email confirmation:', error);
            this.showNotification('Failed to complete email confirmation. Please try logging in.', 'error');
            window.history.replaceState(null, '', 'login.html');
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 3000);
            return true; // Handled
          }
          
          if (data?.user) {
            // Successfully confirmed and logged in
            this.showNotification('Email confirmed successfully! Welcome to your dashboard.', 'success');
            
            // Store user session
            this.currentUser = this.mapSupabaseUser(data.user);
            localStorage.setItem('ai_interviewer_user', JSON.stringify(this.currentUser));
            
            // Clean up URL hash
            window.history.replaceState(null, '', 'dashboard.html');
            
            // Load dashboard data
            await this.loadDashboardData();
            return true; // Handled
          }
        } catch (err) {
          console.error('Error handling email confirmation:', err);
          this.showNotification('An error occurred during email confirmation. Please try logging in.', 'error');
          window.history.replaceState(null, '', 'login.html');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 3000);
          return true; // Handled
        }
      }
    }
    return false; // Not a confirmation callback
  }

  initializeEventListeners() {
    // Topic cards click handlers
    const topicCards = document.querySelectorAll('.topic-card');
    topicCards.forEach(card => {
      card.addEventListener('click', () => {
        const topic = card.dataset.topic;
        this.navigateToPractice(topic);
      });
    });

    // Goal items click handlers
    const goalItems = document.querySelectorAll('.goal-item');
    goalItems.forEach(item => {
      item.addEventListener('click', () => {
        this.showGoalDetails(item);
      });
    });
  }

  async loadDashboardData() {
    if (!this.currentUser) {
      console.log('No current user, cannot load dashboard data');
      return;
    }

    try {
      // Show loaders for each section
      this.showLoader('chartLoader');
      this.showLoader('topicsLoader');
      this.showLoader('activityLoader');
      
      this.showLoading();
      
      // Wait for Supabase client and DB to be ready (reduced wait time)
      let waitCount = 0;
      while ((!window.supabaseClient || !window.supabaseDB) && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        waitCount++;
      }

      let userStats, userProgress, userSessions;
      
      // Get user ID from Supabase session or currentUser
      let userId = this.currentUser.id;
      if (window.supabaseClient) {
        try {
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          if (user?.id) {
            userId = user.id;
            // Update currentUser with Supabase user ID if different
            if (this.currentUser.id !== userId) {
              this.currentUser.id = userId;
            }
          }
        } catch (error) {
          console.warn('Could not get user from Supabase session, using currentUser:', error);
        }
      }

      // Try Express backend first, then Supabase, then empty data
      if (window.backendAPI) {
        try {
          // Load from Express backend in parallel for faster loading
          const [statsData, progressData, sessionsData] = await Promise.allSettled([
            window.backendAPI.getStats(userId),
            window.backendAPI.getProgress(userId),
            window.backendAPI.getSessions(userId)
          ]);
          
          // Check if all requests failed (backend is down)
          const allFailed = statsData.status === 'rejected' && 
                           progressData.status === 'rejected' && 
                           sessionsData.status === 'rejected';
          
          // Check if all failures are network errors (backend down)
          const allNetworkErrors = allFailed && 
            statsData.reason?.isNetworkError &&
            progressData.reason?.isNetworkError &&
            sessionsData.reason?.isNetworkError;
          
          if (allNetworkErrors) {
            // Backend is down - immediately fallback to Supabase without logging
            throw new Error('Backend unavailable');
          }
          
          userStats = statsData.status === 'fulfilled' ? statsData.value : null;
          userProgress = progressData.status === 'fulfilled' ? progressData.value : [];
          userSessions = sessionsData.status === 'fulfilled' ? sessionsData.value : [];
          
          // Update sections as data arrives
          if (sessionsData.status === 'fulfilled' && userSessions !== null && userSessions !== undefined) {
            this.updateProgressChart(userSessions);
            this.updateRecentActivity(userSessions);
            // Loaders are hidden inside update functions
          }
          if (progressData.status === 'fulfilled' && userProgress !== null && userProgress !== undefined) {
            this.updateTopicPerformance(userProgress);
            // Loader is hidden inside update function
          }
          
          // Only log if we got data
          if (userStats || userProgress.length > 0 || userSessions.length > 0) {
            console.log('Backend API data loaded:', { 
              stats: userStats, 
              progressCount: userProgress.length, 
              sessionsCount: userSessions.length 
            });
          }
        } catch (backendError) {
          // Silent fallback - backend is down, try Supabase
          
          // Fallback to Supabase
          if (window.supabaseClient && window.supabaseDB) {
            try {
              
              // Load from Supabase in parallel for faster loading
              const [statsData, progressData, sessionsData] = await Promise.allSettled([
                window.supabaseDB.getUserStats(userId),
                window.supabaseDB.getUserProgress(userId),
                window.supabaseDB.getUserSessions(userId)
              ]);
              
              userStats = statsData.status === 'fulfilled' ? statsData.value : null;
              userProgress = progressData.status === 'fulfilled' ? progressData.value : [];
              userSessions = sessionsData.status === 'fulfilled' ? sessionsData.value : [];
              
              // Update sections as data arrives
              if (sessionsData.status === 'fulfilled' && userSessions !== null && userSessions !== undefined) {
                this.updateProgressChart(userSessions);
                this.updateRecentActivity(userSessions);
                // Loaders are hidden inside update functions
              }
              if (progressData.status === 'fulfilled' && userProgress !== null && userProgress !== undefined) {
                this.updateTopicPerformance(userProgress);
                // Loader is hidden inside update function
              }
              
              console.log('Supabase data loaded (direct):', { 
                stats: userStats, 
                progressCount: userProgress.length, 
                sessionsCount: userSessions.length 
              });
            } catch (supabaseError) {
              console.error('Supabase error loading data:', supabaseError);
              userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
              userProgress = [];
              userSessions = [];
              console.log('Using empty data (databases not available)');
            }
          } else {
            userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
            userProgress = [];
            userSessions = [];
            console.log('Using empty data (no backend available)');
          }
        }
      } else if (window.supabaseClient && window.supabaseDB) {
        try {
          console.log('Loading data from Supabase for user:', userId);
          
          // Load from Supabase in parallel for faster loading
          const [statsData, progressData, sessionsData] = await Promise.allSettled([
            window.supabaseDB.getUserStats(userId),
            window.supabaseDB.getUserProgress(userId),
            window.supabaseDB.getUserSessions(userId)
          ]);
          
          userStats = statsData.status === 'fulfilled' ? statsData.value : null;
          userProgress = progressData.status === 'fulfilled' ? progressData.value : [];
          userSessions = sessionsData.status === 'fulfilled' ? sessionsData.value : [];
          
          // Update sections as data arrives
          if (sessionsData.status === 'fulfilled' && userSessions !== null && userSessions !== undefined) {
            this.updateProgressChart(userSessions);
            this.updateRecentActivity(userSessions);
            // Loaders are hidden inside update functions
          }
          if (progressData.status === 'fulfilled' && userProgress !== null && userProgress !== undefined) {
            this.updateTopicPerformance(userProgress);
            // Loader is hidden inside update function
          }
          
          console.log('Supabase data loaded:', { 
            stats: userStats, 
            progressCount: userProgress.length, 
            sessionsCount: userSessions.length 
          });
        } catch (supabaseError) {
          console.error('Supabase error loading data:', supabaseError);
          userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
          userProgress = [];
          userSessions = [];
          console.log('Using empty data (Supabase tables may not be set up)');
        }
      } else {
        console.log('No backend available, using empty data');
        userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
        userProgress = [];
        userSessions = [];
      }
      
      // Ensure we have valid data
      userStats = userStats || { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
      userProgress = userProgress || [];
      userSessions = userSessions || [];

      // Derive basic stats from sessions and blend with backend stats (prefer non-zero derived)
      try {
        const totals = (userSessions || []).reduce((acc, s) => {
          const resultsArr = this.normalizeResults(s.results);
          const correct = resultsArr.filter(r => r.isCorrect === true).length;
          acc.totalSolved += correct;
          acc.totalQuestions += resultsArr.length;
          acc.totalTime += Number.isFinite(s.totalTime) ? s.totalTime : 0;
          return acc;
        }, { totalSolved: 0, totalQuestions: 0, totalTime: 0 });

        const derivedAccuracy = totals.totalQuestions > 0
          ? Math.round((totals.totalSolved / totals.totalQuestions) * 100)
          : 0;

        userStats = userStats || {};
        const apiSolved = Number.isFinite(userStats.totalSolved) ? userStats.totalSolved : 0;
        const apiTime = Number.isFinite(userStats.totalTime) ? userStats.totalTime : 0;
        const apiAccuracy = Number.isFinite(userStats.accuracy) ? userStats.accuracy : 0;

        userStats.totalSolved = Math.max(apiSolved, totals.totalSolved);
        userStats.totalTime = Math.max(apiTime, totals.totalTime);
        userStats.accuracy = apiAccuracy > 0 ? apiAccuracy : derivedAccuracy;
        userStats.streak = Number.isFinite(userStats.streak) ? userStats.streak : 0;
        userStats.progress = Array.isArray(userStats.progress) ? userStats.progress : [];
      } catch (_) {
        // Non-fatal; keep existing userStats
      }
      
      this.userStats = userStats;
      
      // Update dashboard with data (always update to ensure latest data is shown)
      this.updateStatsCards();
      this.updateProgressChart(userSessions);
      this.updateTopicPerformance(userProgress);
      this.updateRecentActivity(userSessions);
      this.updateGoals();
      
      // Ensure all loaders are hidden (update functions should have already hidden them)
      this.hideLoader('chartLoader');
      this.hideLoader('topicsLoader');
      this.hideLoader('activityLoader');
      
      console.log('Dashboard updated with real data:', userStats);
      
    } catch (error) {
      console.error('Dashboard load error:', error);
      // On error, show empty state instead of mock data
      this.userStats = { totalSolved: 0, totalTime: 0, accuracy: 0, streak: 0, progress: [] };
      this.updateStatsCards();
      this.updateProgressChart([]);
      this.updateTopicPerformance([]);
      this.updateRecentActivity([]);
      this.updateGoals();
      this.hideLoader('chartLoader');
      this.hideLoader('topicsLoader');
      this.hideLoader('activityLoader');
      this.showNotification('No practice data yet. Complete some sessions to see your stats!', 'info');
    } finally {
      this.hideLoading();
    }
  }

  updateStatsCards() {
    console.log('updateStatsCards called with stats:', this.userStats);
    
    // Get elements
    const streakEl = document.getElementById('streakCount');
    const solvedEl = document.getElementById('totalSolved');
    const timeEl = document.getElementById('totalTime');
    const accuracyEl = document.getElementById('accuracy');
    
    if (!streakEl || !solvedEl || !timeEl || !accuracyEl) {
      console.error('Stats card elements not found!');
      return;
    }
    
    if (!this.userStats) {
      // Show zeros if no stats
      streakEl.textContent = '0';
      solvedEl.textContent = '0';
      timeEl.textContent = '0h 0m';
      accuracyEl.textContent = '0%';
      console.log('No stats available, showing zeros');
      return;
    }

    // Update streak
    const streak = this.userStats.streak || 0;
    streakEl.textContent = streak;
    
    // Update total solved
    const totalSolved = this.userStats.totalSolved || 0;
    solvedEl.textContent = totalSolved;
    
    // Update total time
    const totalTime = this.userStats.totalTime || 0;
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    timeEl.textContent = `${hours}h ${minutes}m`;
    
    // Update accuracy
    const accuracy = this.userStats.accuracy || 0;
    accuracyEl.textContent = `${accuracy}%`;
    
    console.log('Stats cards updated:', { streak, totalSolved, totalTime, accuracy });
  }

  updateProgressChart(sessions) {
    const ctx = document.getElementById('progressChart');
    const container = ctx?.parentElement;
    if (!ctx) {
      // Chart canvas not ready yet, skip
      return;
    }

    // Reset container state before updating
    if (container) {
      container.classList.remove('loaded');
    }

    // Prepare data for the last 7 days
    const last7Days = this.getLast7Days();
    const dailyData = this.prepareDailyData(sessions || [], last7Days);

    // Destroy existing chart if it exists
    if (this.progressChart) {
      this.progressChart.destroy();
      this.progressChart = null;
    }

    this.progressChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days.map(date => date.toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [{
          label: 'Problems Solved',
          data: dailyData,
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          }
        }
      }
    });
    
    // Show chart container after chart is created
    if (container) {
      container.classList.add('loaded');
    }
    
    // Hide loader after chart is created
    this.hideLoader('chartLoader');
  }

  // Normalize results to an array (handles stringified JSON from some backends)
  normalizeResults(results) {
    if (!results) return [];
    if (Array.isArray(results)) return results;
    if (typeof results === 'string') {
      try {
        const parsed = JSON.parse(results);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }
    return [];
  }

  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }

  prepareDailyData(sessions, dates) {
    const dailyData = new Array(7).fill(0);
    
    if (!sessions || sessions.length === 0) {
      return dailyData; // Return all zeros if no sessions
    }
    
    sessions.forEach(session => {
      // Be permissive about status casing/value; rely on endTime + results presence
      const hasEnd = !!session.endTime;
      const resultsArr = this.normalizeResults(session.results);
      if (hasEnd && resultsArr.length >= 0) {
        const sessionDate = new Date(session.endTime);
        const dayIndex = dates.findIndex(date => {
          const sessionDay = new Date(sessionDate);
          sessionDay.setHours(0, 0, 0, 0);
          const compareDay = new Date(date);
          compareDay.setHours(0, 0, 0, 0);
          return sessionDay.getTime() === compareDay.getTime();
        });
        
        if (dayIndex !== -1) {
          const correctAnswers = resultsArr.filter(r => r.isCorrect === true).length;
          dailyData[dayIndex] += correctAnswers;
        }
      }
    });
    
    return dailyData;
  }

  updateTopicPerformance(userProgress) {
    const topicsGrid = document.getElementById('topicsGrid') || document.querySelector('.topics-grid');
    if (!topicsGrid) {
      console.error('Topics grid not found');
      return;
    }

    // Reset container state before updating
    topicsGrid.classList.remove('loaded');
    
    // Clear existing content
    topicsGrid.innerHTML = '';

    // Define topic configuration
    const topicConfig = {
      'arrays': { icon: 'fa-list', name: 'Arrays' },
      'strings': { icon: 'fa-font', name: 'Strings' },
      'graphs': { icon: 'fa-project-diagram', name: 'Graphs' },
      'dynamic-programming': { icon: 'fa-brain', name: 'Dynamic Programming' },
      'trees': { icon: 'fa-sitemap', name: 'Trees' }
    };

    // Initialize topic stats with default values
    const topicStats = {};
    Object.keys(topicConfig).forEach(topic => {
      topicStats[topic] = {
        totalAttempted: 0,
        totalCorrect: 0,
        accuracy: 0
      };
    });

    // If we have progress data, aggregate it by topic
    if (userProgress && userProgress.length > 0) {
      userProgress.forEach(progress => {
        if (topicStats[progress.topic]) {
          topicStats[progress.topic].totalAttempted += (progress.totalAttempted || 0);
          topicStats[progress.topic].totalCorrect += (progress.totalCorrect || 0);
        }
      });
    }

    // Calculate accuracy for each topic
    Object.keys(topicStats).forEach(topic => {
      const stats = topicStats[topic];
      stats.accuracy = stats.totalAttempted > 0 ? 
        Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0;
    });

    // Show all topics, even if no progress
    Object.keys(topicConfig).forEach(topic => {
      const config = topicConfig[topic];
      const stats = topicStats[topic] || { totalAttempted: 0, totalCorrect: 0, accuracy: 0 };
      const failed = stats.totalAttempted - stats.totalCorrect;

      const topicCard = document.createElement('div');
      topicCard.className = 'topic-card';
      topicCard.dataset.topic = topic;
      
      topicCard.innerHTML = `
        <div class="topic-header">
          <h3><i class="fa-solid ${config.icon}"></i> ${config.name}</h3>
          <span class="topic-score">${stats.accuracy}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stats.accuracy}%"></div>
        </div>
        <div class="topic-stats">
          <span>${stats.totalCorrect} solved</span>
          <span>${failed} failed</span>
        </div>
      `;

      topicsGrid.appendChild(topicCard);
    });
    
    // Show topics grid after content is loaded
    topicsGrid.classList.add('loaded');
    
    // Hide loader after topics are loaded
    this.hideLoader('topicsLoader');
  }

  updateRecentActivity(sessions) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    // Reset container state before updating
    activityList.classList.remove('loaded');
    
    activityList.innerHTML = '';

    // Get recent sessions (last 5)
    const recentSessions = (sessions || [])
      .filter(session => {
        const hasEnd = !!session.endTime;
        const resultsArr = this.normalizeResults(session.results);
        return hasEnd && resultsArr.length >= 0;
      })
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
      .slice(0, 5);

    if (recentSessions.length === 0) {
      activityList.innerHTML = `
        <div class="activity-empty">
          <div class="activity-empty-icon">
            <i class="fa-solid fa-inbox"></i>
          </div>
          <div class="activity-empty-content">
            <h4>No Recent Activity</h4>
            <p>Start practicing to see your recent activity here!</p>
          </div>
        </div>
      `;
      activityList.classList.add('loaded');
      // Hide loader after showing empty state
      this.hideLoader('activityLoader');
      return;
    }

    recentSessions.forEach(session => {
      const resultsArr = this.normalizeResults(session.results);
      const correctAnswers = resultsArr.filter(r => r.isCorrect === true).length;
      const totalQuestions = resultsArr.length || 0;
      const timeSpent = session.totalTime ? Math.floor(session.totalTime / 60) : 0;
      
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      
      activityItem.innerHTML = `
        <div class="activity-icon">
          <i class="fa-solid fa-code"></i>
        </div>
        <div class="activity-content">
          <h4>${session.topic.charAt(0).toUpperCase() + session.topic.slice(1)} Practice</h4>
          <p>Solved ${correctAnswers}/${totalQuestions} problems in ${timeSpent} minutes</p>
        </div>
        <div class="activity-time">
          ${this.formatTimeAgo(new Date(session.endTime))}
        </div>
      `;

      activityList.appendChild(activityItem);
    });
    
    // Show activity list after content is loaded
    activityList.classList.add('loaded');
    
    // Hide loader after activity is loaded
    this.hideLoader('activityLoader');
  }
  
  showLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) {
      loader.classList.remove('hidden');
    }
  }
  
  hideLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) {
      loader.classList.add('hidden');
    }
  }

  updateGoals() {
    const goalsList = document.querySelector('.goals-list');
    if (!goalsList || !this.userStats) return;

    // Update existing goals with real data
    const goalItems = goalsList.querySelectorAll('.goal-item');
    
    // Goal 1: Solve 50 Problems
    if (goalItems[0]) {
      const totalSolved = this.userStats.totalSolved || 0;
      const progress = Math.min((totalSolved / 50) * 100, 100);
      const progressBar = goalItems[0].querySelector('.progress-fill');
      const progressText = goalItems[0].querySelector('.goal-progress span');
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${totalSolved}/50`;
      
      const goalContent = goalItems[0].querySelector('.goal-content p');
      if (goalContent) {
        if (totalSolved === 0) {
          goalContent.textContent = 'Start practicing to track your progress!';
        } else if (progress >= 100) {
          goalContent.textContent = 'Goal achieved! Great work!';
        } else {
          goalContent.textContent = `You're ${Math.round(progress)}% of the way there!`;
        }
      }
    }

    // Goal 2: Maintain Streak
    if (goalItems[1]) {
      const currentStreak = this.userStats.streak || 0;
      const targetStreak = 7;
      const progress = Math.min((currentStreak / targetStreak) * 100, 100);
      const progressBar = goalItems[1].querySelector('.progress-fill');
      const progressText = goalItems[1].querySelector('.goal-progress span');
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${currentStreak}/${targetStreak}`;
      
      const goalContent = goalItems[1].querySelector('.goal-content p');
      if (goalContent) {
        if (currentStreak >= targetStreak) {
          goalContent.textContent = 'Goal achieved! Keep it up!';
        } else if (currentStreak === 0) {
          goalContent.textContent = 'Start a practice session to begin your streak!';
        } else {
          goalContent.textContent = `Keep it up! You're on day ${currentStreak}.`;
        }
      }
    }

    // Goal 3: Improve Accuracy
    if (goalItems[2]) {
      const currentAccuracy = this.userStats.accuracy || 0;
      const targetAccuracy = 80;
      const progress = Math.min((currentAccuracy / targetAccuracy) * 100, 100);
      const progressBar = goalItems[2].querySelector('.progress-fill');
      const progressText = goalItems[2].querySelector('.goal-progress span');
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${currentAccuracy}%`;
      
      const goalContent = goalItems[2].querySelector('.goal-content p');
      if (goalContent) {
        if (currentAccuracy === 0) {
          goalContent.textContent = 'Complete some practice sessions to track accuracy!';
        } else if (currentAccuracy >= targetAccuracy) {
          goalContent.textContent = 'Excellent accuracy! Keep it up!';
        } else {
          goalContent.textContent = `Focus on accuracy to reach ${targetAccuracy}%.`;
        }
      }
    }
  }

  navigateToPractice(topic) {
    // Store selected topic in localStorage for practice session
    localStorage.setItem('ai_interviewer_selected_topic', topic);
    window.location.href = 'practice.html';
  }

  showGoalDetails(goalItem) {
    const goalTitle = goalItem.querySelector('h4').textContent;
    this.showNotification(`Goal: ${goalTitle}`, 'info');
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  showLoading() {
    // Add loading overlay if needed
    const dashboard = document.querySelector('.dashboard-grid');
    if (dashboard) {
      dashboard.style.opacity = '0.6';
    }
  }

  hideLoading() {
    const dashboard = document.querySelector('.dashboard-grid');
    if (dashboard) {
      dashboard.style.opacity = '1';
    }
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fa-solid fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  setupErrorHandling() {
    // Suppress unhandled promise rejections for expected network errors when backend is down
    // This prevents console noise from "Failed to fetch" errors when backend isn't running
    if (window.dashboardErrorHandlerAdded) return; // Only add once
    
    window.dashboardErrorHandlerAdded = true;
    
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      
      // Suppress expected network errors when backend is down
      if (error && typeof error === 'object') {
        // Check if it's a handled network error
        if (error.handled === true && error.isNetworkError === true) {
          event.preventDefault(); // Suppress the error
          return;
        }
      }
      
      // Suppress common network errors that are expected when backend is down
      const errorMessage = error?.message || error?.toString() || '';
      if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_CONNECTION_REFUSED') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('TypeError: Failed to fetch')
      ) {
        // These are expected when backend is down - suppress them
        event.preventDefault();
        return;
      }
    });
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DashboardSystem();
});