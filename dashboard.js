// Dashboard functionality with dynamic data and charts
class DashboardManager {
  constructor() {
    this.userData = this.loadUserData();
    this.chart = null;
    this.initializeDashboard();
  }

  loadUserData() {
    // In a real app, this would come from a backend API
    return {
      streak: 7,
      totalSolved: 42,
      totalTime: 754, // minutes
      accuracy: 78,
      topics: {
        arrays: { solved: 12, failed: 2, score: 85 },
        strings: { solved: 8, failed: 3, score: 72 },
        graphs: { solved: 6, failed: 3, score: 65 },
        "dynamic-programming": { solved: 5, failed: 4, score: 58 },
        trees: { solved: 11, failed: 3, score: 80 }
      },
      recentActivity: [
        { type: 'solved', topic: 'Arrays', problem: 'Two Sum', difficulty: 'Easy', time: '2 minutes ago' },
        { type: 'solved', topic: 'Trees', problem: 'Maximum Depth', difficulty: 'Easy', time: '1 hour ago' },
        { type: 'failed', topic: 'Dynamic Programming', problem: 'House Robber', difficulty: 'Medium', time: '2 hours ago' },
        { type: 'solved', topic: 'Strings', problem: 'Valid Parentheses', difficulty: 'Easy', time: '3 hours ago' },
        { type: 'solved', topic: 'Graphs', problem: 'Number of Islands', difficulty: 'Medium', time: '1 day ago' }
      ],
      progressData: [
        { date: '2024-01-01', solved: 0 },
        { date: '2024-01-02', solved: 2 },
        { date: '2024-01-03', solved: 5 },
        { date: '2024-01-04', solved: 8 },
        { date: '2024-01-05', solved: 12 },
        { date: '2024-01-06', solved: 15 },
        { date: '2024-01-07', solved: 18 },
        { date: '2024-01-08', solved: 22 },
        { date: '2024-01-09', solved: 25 },
        { date: '2024-01-10', solved: 28 },
        { date: '2024-01-11', solved: 32 },
        { date: '2024-01-12', solved: 35 },
        { date: '2024-01-13', solved: 38 },
        { date: '2024-01-14', solved: 42 }
      ]
    };
  }

  initializeDashboard() {
    this.updateStats();
    this.createProgressChart();
    this.updateTopicCards();
    this.populateActivityList();
    this.animateElements();
  }

  updateStats() {
    // Update stat cards with dynamic styling
    this.updateStatCard('streakCount', this.userData.streak, '#f59e0b');
    this.updateStatCard('totalSolved', this.userData.totalSolved, '#10b981');
    this.updateStatCard('totalTime', this.formatTime(this.userData.totalTime), '#3b82f6');
    this.updateStatCard('accuracy', `${this.userData.accuracy}%`, this.getAccuracyColor(this.userData.accuracy));
  }

  updateStatCard(elementId, value, color) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
      element.style.color = color;
      element.style.transition = 'color 0.3s ease';
    }
  }

  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getAccuracyColor(accuracy) {
    if (accuracy >= 80) return '#10b981';
    if (accuracy >= 60) return '#f59e0b';
    return '#ef4444';
  }

  createProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.userData.progressData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          label: 'Problems Solved',
          data: this.userData.progressData.map(d => d.solved),
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1a73e8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
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
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280',
              maxTicksLimit: 7
            }
          }
        },
        elements: {
          point: {
            hoverBackgroundColor: '#1a73e8'
          }
        }
      }
    });
  }

  updateTopicCards() {
    const topicCards = document.querySelectorAll('.topic-card');
    
    topicCards.forEach(card => {
      const topic = card.dataset.topic;
      const topicData = this.userData.topics[topic];
      
      if (topicData) {
        const scoreElement = card.querySelector('.topic-score');
        const progressFill = card.querySelector('.progress-fill');
        const statsElements = card.querySelectorAll('.topic-stats span');
        
        if (scoreElement) {
          scoreElement.textContent = `${topicData.score}%`;
          scoreElement.style.color = this.getAccuracyColor(topicData.score);
        }
        
        if (progressFill) {
          progressFill.style.width = `${topicData.score}%`;
          progressFill.style.backgroundColor = this.getAccuracyColor(topicData.score);
        }
        
        if (statsElements.length >= 2) {
          statsElements[0].textContent = `${topicData.solved} solved`;
          statsElements[1].textContent = `${topicData.failed} failed`;
        }
      }
    });
  }

  populateActivityList() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    activityList.innerHTML = '';
    
    this.userData.recentActivity.forEach(activity => {
      const activityItem = this.createActivityItem(activity);
      activityList.appendChild(activityItem);
    });
  }

  createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    const iconClass = activity.type === 'solved' ? 'fa-check-circle' : 'fa-times-circle';
    const iconColor = activity.type === 'solved' ? '#10b981' : '#ef4444';
    const difficultyColor = this.getDifficultyColor(activity.difficulty);
    
    item.innerHTML = `
      <div class="activity-icon" style="color: ${iconColor}">
        <i class="fa-solid ${iconClass}"></i>
      </div>
      <div class="activity-content">
        <h4>${activity.problem}</h4>
        <p>${activity.topic} • <span style="color: ${difficultyColor}">${activity.difficulty}</span></p>
      </div>
      <div class="activity-time">
        ${activity.time}
      </div>
    `;
    
    return item;
  }

  getDifficultyColor(difficulty) {
    const colors = {
      'Easy': '#10b981',
      'Medium': '#f59e0b',
      'Hard': '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  }

  animateElements() {
    // Animate stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 100);
      }, index * 100);
    });

    // Animate topic cards
    const topicCards = document.querySelectorAll('.topic-card');
    topicCards.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        card.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateX(0)';
        }, 100);
      }, (index * 100) + 500);
    });

    // Animate activity items
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach((item, index) => {
      setTimeout(() => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        item.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateX(0)';
        }, 50);
      }, (index * 50) + 1000);
    });
  }

  // Method to simulate real-time updates
  updateStatsRealtime() {
    // Simulate solving a new problem
    this.userData.totalSolved++;
    this.userData.totalTime += Math.floor(Math.random() * 30) + 5; // 5-35 minutes
    
    // Update accuracy (simulate slight improvement)
    if (Math.random() > 0.3) {
      this.userData.accuracy = Math.min(100, this.userData.accuracy + 1);
    }
    
    this.updateStats();
    this.createProgressChart();
  }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new DashboardManager();
  
  // Simulate real-time updates every 30 seconds (for demo purposes)
  setInterval(() => {
    dashboard.updateStatsRealtime();
  }, 30000);
});
