/**
 * AI Business Assistant - Client-Side Chatbot
 * Stores all data locally in browser localStorage
 * Remembers conversations and user information
 */

class AIBusinessAssistant {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.exportHistoryBtn = document.getElementById('exportHistory');
        this.toggleMemoryBtn = document.getElementById('toggleMemory');
        
        this.storageKey = 'ai-business-assistant-data';
        this.memoryEnabled = true;
        this.conversationHistory = [];
        this.userProfile = {};
        
        this.initializeFromStorage();
        this.attachEventListeners();
        this.loadChatHistory();
    }

    initializeFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.conversationHistory = data.conversationHistory || [];
                this.userProfile = data.userProfile || {};
                this.memoryEnabled = data.memoryEnabled !== undefined ? data.memoryEnabled : true;
            } catch (e) {
                console.error('Error loading stored data:', e);
            }
        }
        
        // Update memory toggle button
        this.updateMemoryButton();
    }

    saveToStorage() {
        const data = {
            conversationHistory: this.conversationHistory,
            userProfile: this.userProfile,
            memoryEnabled: this.memoryEnabled,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to storage:', e);
            this.showError('Failed to save data to browser storage. Storage might be full.');
        }
    }

    attachEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.userInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.exportHistoryBtn.addEventListener('click', () => this.exportHistory());
        this.toggleMemoryBtn.addEventListener('click', () => this.toggleMemory());
    }

    autoResizeTextarea() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
    }

    loadChatHistory() {
        // Display previous conversation history
        if (this.conversationHistory.length > 0) {
            const historyHeader = document.createElement('div');
            historyHeader.className = 'message ai-message';
            historyHeader.innerHTML = `
                <div class="message-content">
                    <strong>Previous conversation restored</strong><br>
                    Welcome back! I remember our last ${this.conversationHistory.length} message(s).
                </div>
            `;
            this.chatMessages.appendChild(historyHeader);
            
            // Show last few messages
            const recentMessages = this.conversationHistory.slice(-5);
            recentMessages.forEach(msg => {
                this.displayMessage(msg.role, msg.content, false);
            });
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;
        
        // Display user message
        this.displayMessage('user', message);
        this.userInput.value = '';
        this.autoResizeTextarea();
        
        // Save to history if memory is enabled
        if (this.memoryEnabled) {
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
        }
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Disable input while processing
        this.sendButton.disabled = true;
        this.userInput.disabled = true;
        
        try {
            // Generate AI response
            const aiResponse = await this.generateAIResponse(message);
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Display AI response
            this.displayMessage('ai', aiResponse);
            
            // Save to history if memory is enabled
            if (this.memoryEnabled) {
                this.conversationHistory.push({
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Update user profile based on conversation
            this.updateUserProfile(message);
            
            // Save everything to storage
            this.saveToStorage();
            
        } catch (error) {
            this.removeTypingIndicator();
            this.showError('Sorry, I encountered an error. Please try again.');
            console.error('Error:', error);
        } finally {
            this.sendButton.disabled = false;
            this.userInput.disabled = false;
            this.userInput.focus();
        }
    }

    async generateAIResponse(userMessage) {
        // Simulate AI thinking time
        await this.delay(1000 + Math.random() * 1000);
        
        // Build context from conversation history
        const context = this.buildContext();
        
        // Generate intelligent responses based on common business queries
        const response = this.generateIntelligentResponse(userMessage, context);
        
        return response;
    }

    buildContext() {
        let context = '';
        
        if (this.userProfile.name) {
            context += `User name: ${this.userProfile.name}. `;
        }
        
        if (this.userProfile.businessType) {
            context += `Business type: ${this.userProfile.businessType}. `;
        }
        
        if (this.conversationHistory.length > 0) {
            context += `Previous interactions: ${this.conversationHistory.length} messages. `;
        }
        
        return context;
    }

    generateIntelligentResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        
        // Name detection
        if (lowerMessage.includes('my name is') || lowerMessage.includes("i'm ") || lowerMessage.includes("i am ")) {
            const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([\w\s'-]+)/i);
            if (nameMatch) {
                this.userProfile.name = nameMatch[1].trim();
                return `Nice to meet you, ${nameMatch[1].trim()}! I'll remember your name for our future conversations. How can I help your business today?`;
            }
        }
        
        // Business type detection
        if (lowerMessage.includes('my business') || lowerMessage.includes('we sell') || lowerMessage.includes('we are')) {
            const businessTypes = ['restaurant', 'retail', 'consulting', 'service', 'tech', 'e-commerce', 'manufacturing'];
            for (const type of businessTypes) {
                if (lowerMessage.includes(type)) {
                    this.userProfile.businessType = type;
                    break;
                }
            }
        }
        
        // Greeting responses
        if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
            const greetings = [
                `Hello${this.userProfile.name ? ', ' + this.userProfile.name : ''}! How can I assist your business today?`,
                `Hi there${this.userProfile.name ? ', ' + this.userProfile.name : ''}! What would you like to discuss?`,
                `Hey${this.userProfile.name ? ', ' + this.userProfile.name : ''}! I'm here to help. What's on your mind?`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        
        // Business advice queries
        if (lowerMessage.includes('marketing') || lowerMessage.includes('advertis')) {
            return `Great question about marketing! Here are some key strategies for small businesses:\n\n1. **Social Media Marketing**: Build presence on platforms where your customers are\n2. **Content Marketing**: Create valuable content that addresses customer needs\n3. **Email Marketing**: Build and nurture an email list\n4. **Local SEO**: Optimize for local search results\n5. **Customer Referrals**: Encourage satisfied customers to spread the word\n\nWould you like me to elaborate on any of these strategies${this.userProfile.businessType ? ' for your ' + this.userProfile.businessType + ' business' : ''}?`;
        }
        
        if (lowerMessage.includes('customer') && (lowerMessage.includes('service') || lowerMessage.includes('satisfaction'))) {
            return `Excellent customer service is crucial for business success! Here are proven approaches:\n\n1. **Response Time**: Aim to respond to inquiries within 24 hours\n2. **Personalization**: Remember customer preferences and history\n3. **Active Listening**: Understand customer needs before offering solutions\n4. **Follow-up**: Check in after resolving issues\n5. **Feedback**: Regularly collect and act on customer feedback\n\nWhat specific aspect of customer service would you like to improve?`;
        }
        
        if (lowerMessage.includes('sales') || lowerMessage.includes('revenue') || lowerMessage.includes('profit')) {
            return `Let's talk about growing your sales and revenue! Consider these approaches:\n\n1. **Upselling/Cross-selling**: Offer complementary products or upgrades\n2. **Customer Retention**: It's cheaper to keep existing customers than acquire new ones\n3. **Pricing Strategy**: Review your pricing to ensure it reflects your value\n4. **Sales Funnel**: Optimize each stage of your customer journey\n5. **Partnerships**: Collaborate with complementary businesses\n\nWhat's your biggest challenge with sales right now?`;
        }
        
        if (lowerMessage.includes('website') || lowerMessage.includes('online presence')) {
            return `Having a strong online presence is essential! Here's what you should focus on:\n\n1. **Professional Website**: Clean, mobile-friendly design\n2. **Clear Value Proposition**: Immediately show what makes you unique\n3. **Contact Information**: Make it easy for customers to reach you\n4. **Testimonials**: Display social proof and customer reviews\n5. **Call-to-Action**: Guide visitors to take the next step\n\nAre you looking to improve an existing website or build a new one?`;
        }
        
        if (lowerMessage.includes('social media')) {
            return `Social media is a powerful tool for small businesses! Here's a strategic approach:\n\n1. **Choose the Right Platforms**: Focus on where your customers spend time\n2. **Consistent Posting**: Regular, valuable content keeps you visible\n3. **Engagement**: Respond to comments and messages promptly\n4. **Visual Content**: Use high-quality images and videos\n5. **Analytics**: Track what content performs best\n\n${this.userProfile.businessType ? 'For a ' + this.userProfile.businessType + ' business, I recommend focusing on Instagram and Facebook.' : 'Which platforms are you currently using?'}`;
        }
        
        if (lowerMessage.includes('productivity') || lowerMessage.includes('efficient') || lowerMessage.includes('time management')) {
            return `Improving productivity can transform your business! Try these strategies:\n\n1. **Prioritization**: Use the Eisenhower Matrix (urgent/important)\n2. **Time Blocking**: Schedule specific tasks for specific times\n3. **Automation**: Use tools to automate repetitive tasks\n4. **Delegation**: Focus on what only you can do\n5. **Regular Breaks**: Prevent burnout with scheduled downtime\n\nWhat tasks are taking up most of your time right now?`;
        }
        
        if (lowerMessage.includes('hire') || lowerMessage.includes('employee') || lowerMessage.includes('team')) {
            return `Building a great team is key to scaling your business! Consider these points:\n\n1. **Clear Job Descriptions**: Define roles and expectations upfront\n2. **Culture Fit**: Hire for values alignment, train for skills\n3. **Onboarding**: Invest time in proper training\n4. **Communication**: Establish clear channels and regular check-ins\n5. **Growth Opportunities**: Show path for advancement\n\nAre you looking to make your first hire or expand an existing team?`;
        }
        
        if (lowerMessage.includes('finance') || lowerMessage.includes('budget') || lowerMessage.includes('cash flow')) {
            return `Financial management is crucial for business sustainability! Focus on:\n\n1. **Cash Flow Tracking**: Monitor money in and out weekly\n2. **Emergency Fund**: Aim for 3-6 months of expenses\n3. **Separate Accounts**: Keep business and personal finances separate\n4. **Invoice Promptly**: Send invoices immediately after work completion\n5. **Regular Review**: Check financial statements monthly\n\nWould you like advice on any specific financial aspect?`;
        }
        
        if (lowerMessage.includes('competition') || lowerMessage.includes('competitor')) {
            return `Understanding your competition is smart business! Here's how to analyze them:\n\n1. **Identify Key Competitors**: Who directly competes for your customers?\n2. **SWOT Analysis**: Assess their Strengths, Weaknesses, Opportunities, Threats\n3. **Differentiation**: What makes you uniquely valuable?\n4. **Pricing**: How does your pricing compare?\n5. **Customer Experience**: Where can you exceed their service?\n\nWhat would make customers choose you over competitors?`;
        }
        
        if (lowerMessage.includes('goal') || lowerMessage.includes('plan') || lowerMessage.includes('strategy')) {
            return `Strategic planning sets successful businesses apart! Follow this framework:\n\n1. **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound\n2. **Break Down**: Divide big goals into quarterly milestones\n3. **Action Items**: List concrete steps for each goal\n4. **Regular Review**: Assess progress monthly\n5. **Flexibility**: Adjust based on results and market changes\n\nWhat's your primary business goal for the next quarter?`;
        }
        
        // Memory reference
        if (this.conversationHistory.length > 5 && lowerMessage.includes('remember')) {
            return `Yes, I remember our conversation! We've discussed ${this.conversationHistory.length} messages so far${this.userProfile.name ? ', ' + this.userProfile.name : ''}. All our conversations are stored securely in your browser. What would you like to revisit?`;
        }
        
        // Help/capabilities
        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            return `I'm your AI Business Assistant! I can help with:\n\n📊 **Business Strategy**: Planning, goals, and growth strategies\n💰 **Sales & Marketing**: Customer acquisition and retention\n👥 **Team Management**: Hiring, leadership, and productivity\n💵 **Finance**: Budgeting, cash flow, and financial planning\n🌐 **Online Presence**: Website, social media, and digital marketing\n⚡ **Operations**: Efficiency, processes, and time management\n\n${this.memoryEnabled ? 'I remember all our conversations, so I can provide personalized advice!' : ''}\n\nWhat business challenge can I help you with today?`;
        }
        
        // Default intelligent response
        const defaultResponses = [
            `That's an interesting question about ${this.extractKeyTopic(message)}. Based on best practices for ${this.userProfile.businessType || 'small'} businesses, I'd recommend focusing on understanding your customers' needs first. Could you provide more details about your specific situation?`,
            `I understand you're asking about ${this.extractKeyTopic(message)}. Every business is unique, but generally speaking, success comes from consistent effort and customer focus. What specific aspect would you like to explore further?`,
            `Thanks for sharing that${this.userProfile.name ? ', ' + this.userProfile.name : ''}! To give you the most helpful advice about ${this.extractKeyTopic(message)}, could you tell me more about your current situation and what you're trying to achieve?`,
            `Great question! ${this.extractKeyTopic(message)} is an important topic for business success. From my experience helping businesses, I'd say the key is to start with small, measurable steps. What's your biggest challenge in this area?`,
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    extractKeyTopic(message) {
        // Extract the main topic from the message
        const words = message.toLowerCase().split(' ');
        const stopWords = ['how', 'what', 'when', 'where', 'why', 'can', 'could', 'should', 'would', 'is', 'are', 'the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at'];
        const meaningfulWords = words.filter(word => word.length > 3 && !stopWords.includes(word));
        return meaningfulWords.length > 0 ? meaningfulWords[0] : 'your question';
    }

    updateUserProfile(message) {
        const lowerMessage = message.toLowerCase();
        
        // Extract company name
        if (lowerMessage.includes('my company') || lowerMessage.includes('our company')) {
            const companyMatch = message.match(/(?:my|our) company (?:is |called )?([\w\s&'-]+)/i);
            if (companyMatch) {
                this.userProfile.company = companyMatch[1].trim();
            }
        }
        
        // Track topics of interest
        if (!this.userProfile.topicsDiscussed) {
            this.userProfile.topicsDiscussed = [];
        }
        
        const topics = ['marketing', 'sales', 'finance', 'hiring', 'website', 'social media', 'customer service'];
        topics.forEach(topic => {
            if (lowerMessage.includes(topic) && !this.userProfile.topicsDiscussed.includes(topic)) {
                this.userProfile.topicsDiscussed.push(topic);
            }
        });
    }

    displayMessage(role, content, animate = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        if (!animate) {
            messageDiv.style.animation = 'none';
        }
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${this.formatMessage(content)}
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Convert markdown-style formatting to HTML
        let formatted = content
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italic
            .replace(/\n/g, '<br>'); // Line breaks
        
        return formatted;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator-wrapper';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
        
        // Auto-remove after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) {
            this.conversationHistory = [];
            this.userProfile = {};
            this.saveToStorage();
            
            // Clear UI
            this.chatMessages.innerHTML = `
                <div class="welcome-message">
                    <h3>History Cleared</h3>
                    <p>Your conversation history has been cleared. Starting fresh!</p>
                </div>
            `;
        }
    }

    exportHistory() {
        const exportData = {
            conversationHistory: this.conversationHistory,
            userProfile: this.userProfile,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-assistant-history-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.displayMessage('ai', 'Your conversation history has been exported successfully! 📥');
    }

    toggleMemory() {
        this.memoryEnabled = !this.memoryEnabled;
        this.updateMemoryButton();
        this.saveToStorage();
        
        const status = this.memoryEnabled ? 'enabled' : 'disabled';
        this.displayMessage('ai', `Memory has been ${status}. ${this.memoryEnabled ? 'I will remember our conversations.' : 'I will not save new messages to history.'}`);
    }

    updateMemoryButton() {
        this.toggleMemoryBtn.textContent = `Memory: ${this.memoryEnabled ? 'On' : 'Off'}`;
        this.toggleMemoryBtn.style.background = this.memoryEnabled ? 'white' : '#fee';
        this.toggleMemoryBtn.style.color = this.memoryEnabled ? '#667eea' : '#c00';
        this.toggleMemoryBtn.style.borderColor = this.memoryEnabled ? '#667eea' : '#c00';
    }
}

// Initialize the chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AIBusinessAssistant();
});
