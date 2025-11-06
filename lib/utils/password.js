/**
 * Generate a secure, readable password for campaign protection
 * Format: word-word-number (e.g., "happy-cloud-42")
 *
 * @param {number} words - Number of words to include (default: 3)
 * @param {boolean} includeNumber - Whether to include a number at the end (default: true)
 * @returns {string} Generated password
 */
export function generatePassword(words = 3, includeNumber = true) {
  // Common, easy-to-type words
  const wordList = [
    'happy', 'sunny', 'bright', 'quick', 'clever', 'smart',
    'blue', 'green', 'red', 'purple', 'yellow', 'pink',
    'cloud', 'river', 'ocean', 'mountain', 'forest', 'meadow',
    'star', 'moon', 'comet', 'planet', 'galaxy', 'cosmic',
    'tiger', 'lion', 'eagle', 'wolf', 'bear', 'falcon',
    'swift', 'rapid', 'flash', 'dash', 'bolt', 'spark',
    'crystal', 'diamond', 'pearl', 'ruby', 'jade', 'amber',
    'gentle', 'calm', 'serene', 'peace', 'harmony', 'zen',
    'magic', 'wonder', 'dream', 'wish', 'hope', 'joy',
    'brave', 'bold', 'strong', 'mighty', 'power', 'force'
  ];

  // Select random words
  const selectedWords = [];
  for (let i = 0; i < words; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    selectedWords.push(wordList[randomIndex]);
  }

  // Add random number if requested
  let password = selectedWords.join('-');
  if (includeNumber) {
    const randomNumber = Math.floor(Math.random() * 100);
    password += '-' + randomNumber;
  }

  return password;
}

/**
 * Generate a more secure alphanumeric password
 * Format: 8 characters with uppercase, lowercase, and numbers
 *
 * @param {number} length - Length of password (default: 8)
 * @returns {string} Generated password
 */
export function generateSecurePassword(length = 8) {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O for readability
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Removed l for readability
  const numbers = '23456789'; // Removed 0, 1 for readability
  const all = uppercase + lowercase + numbers;

  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // Fill the rest randomly
  for (let i = 3; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength (for user-entered passwords)
 *
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, message: string, strength: 'weak'|'medium'|'strong' }
 */
export function validatePassword(password) {
  if (!password || password.length < 4) {
    return {
      isValid: false,
      message: 'Password must be at least 4 characters',
      strength: 'weak'
    };
  }

  if (password.length >= 8) {
    return {
      isValid: true,
      message: 'Strong password',
      strength: 'strong'
    };
  }

  if (password.length >= 6) {
    return {
      isValid: true,
      message: 'Medium strength password',
      strength: 'medium'
    };
  }

  return {
    isValid: true,
    message: 'Weak password - consider using more characters',
    strength: 'weak'
  };
}
