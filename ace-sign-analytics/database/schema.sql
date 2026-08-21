-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Configuration Table
CREATE TABLE IF NOT EXISTS user_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mailerlite_api_token VARCHAR(500),
  meta_access_token VARCHAR(500),
  meta_page_id VARCHAR(100),
  meta_business_account_id VARCHAR(100),
  ga4_property_id VARCHAR(100),
  ga4_api_key VARCHAR(500),
  ga4_measurement_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Metrics Table
CREATE TABLE IF NOT EXISTS email_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id VARCHAR(100),
  opens INT DEFAULT 0,
  clicks INT DEFAULT 0,
  unsubscribes INT DEFAULT 0,
  bounces INT DEFAULT 0,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social Metrics Table (Meta/Instagram)
CREATE TABLE IF NOT EXISTS social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50),
  post_id VARCHAR(100),
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  engagement INT DEFAULT 0,
  followers INT DEFAULT 0,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GA4 Metrics Table
CREATE TABLE IF NOT EXISTS ga_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_users INT DEFAULT 0,
  sessions INT DEFAULT 0,
  engagement_rate DECIMAL(5, 2),
  bounce_rate DECIMAL(5, 2),
  page_views INT DEFAULT 0,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Calendar Table
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  platform VARCHAR(50),
  scheduled_date TIMESTAMP,
  media_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UTM Links Table
CREATE TABLE IF NOT EXISTS utm_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_url VARCHAR(500) NOT NULL,
  source VARCHAR(100) NOT NULL,
  medium VARCHAR(100) NOT NULL,
  campaign VARCHAR(100) NOT NULL,
  content VARCHAR(255),
  utm_url VARCHAR(1000),
  clicks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Data Table
CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50),
  metric_value DECIMAL(10, 2),
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_config_user_id ON user_config(user_id);
CREATE INDEX idx_email_metrics_user_id ON email_metrics(user_id);
CREATE INDEX idx_social_metrics_user_id ON social_metrics(user_id);
CREATE INDEX idx_ga_metrics_user_id ON ga_metrics(user_id);
CREATE INDEX idx_content_calendar_user_id ON content_calendar(user_id);
CREATE INDEX idx_utm_links_user_id ON utm_links(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_analytics_data_user_id ON analytics_data(user_id);
CREATE INDEX idx_email_metrics_created_at ON email_metrics(created_at);
CREATE INDEX idx_social_metrics_created_at ON social_metrics(created_at);
CREATE INDEX idx_ga_metrics_created_at ON ga_metrics(created_at);
