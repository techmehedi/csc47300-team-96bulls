import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { questionService } from '../../services/apiService';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';

const QuestionManagement = () => {
  const { adminRole } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const data = await questionService.getAllQuestions();
      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
      // Load from local JSON as fallback
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuestion({
      title: '',
      description: '',
      topic: '',
      difficulty: 'easy',
      hints: [],
      solution: '',
    });
    setShowModal(true);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setShowModal(true);
  };

  const handleDelete = async (questionId) => {
    if (adminRole !== 'admin2') {
      alert('Only Admin 2 can delete questions');
      return;
    }

    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await questionService.deleteQuestion(questionId);
      loadQuestions();
    } catch (error) {
      alert('Error deleting question: ' + error.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (editingQuestion.id) {
        await questionService.updateQuestion(editingQuestion.id, editingQuestion);
      } else {
        await questionService.createQuestion(editingQuestion);
      }
      setShowModal(false);
      loadQuestions();
    } catch (error) {
      alert('Error saving question: ' + error.message);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = !filterTopic || question.topic === filterTopic;
    const matchesDifficulty = !filterDifficulty || question.difficulty === filterDifficulty;
    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header />
      <main>
        <section className="admin-container" style={{ marginTop: '100px' }}>
          <div className="admin-header">
            <h1>Question Management</h1>
            <button onClick={handleCreate} className="btn btn-primary">
              <i className="fa-solid fa-plus"></i> Create Question
            </button>
          </div>

          <div className="search-filter-bar">
            <input
              type="text"
              placeholder="Search questions..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
            >
              <option value="">All Topics</option>
              <option value="arrays">Arrays</option>
              <option value="strings">Strings</option>
              <option value="graphs">Graphs</option>
              <option value="trees">Trees</option>
              <option value="dynamic-programming">Dynamic Programming</option>
            </select>
            <select
              className="filter-select"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((question) => (
                  <tr key={question.id}>
                    <td>{question.title}</td>
                    <td>{question.topic}</td>
                    <td>
                      <span className={`badge ${question.difficulty}`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(question)}
                          className="btn-icon"
                          title="Edit"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </button>
                        {adminRole === 'admin2' && (
                          <button
                            onClick={() => handleDelete(question.id)}
                            className="btn-icon delete"
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingQuestion.id ? 'Edit Question' : 'Create Question'}</h2>
                <button className="close-button" onClick={() => setShowModal(false)}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={editingQuestion.title}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editingQuestion.description}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, description: e.target.value })
                    }
                    rows="4"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Topic</label>
                  <select
                    value={editingQuestion.topic}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, topic: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Topic</option>
                    <option value="arrays">Arrays</option>
                    <option value="strings">Strings</option>
                    <option value="graphs">Graphs</option>
                    <option value="trees">Trees</option>
                    <option value="dynamic-programming">Dynamic Programming</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })
                    }
                    required
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Solution (JavaScript)</label>
                  <textarea
                    value={editingQuestion.solution}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, solution: e.target.value })
                    }
                    rows="6"
                    placeholder="function solution() { ... }"
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default QuestionManagement;
