import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.timestamps(true, true);
  });

  // Meta accounts
  await knex.schema.createTable('meta_accounts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('account_id').notNullable();
    table.string('access_token').notNullable();
    table.string('account_name');
    table.timestamps(true, true);
    table.unique(['user_id', 'account_id']);
  });

  // Meta posts
  await knex.schema.createTable('meta_posts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('post_id');
    table.text('content');
    table.string('image_url');
    table.datetime('scheduled_time');
    table.string('status').defaultTo('draft');
    table.integer('likes').defaultTo(0);
    table.integer('comments').defaultTo(0);
    table.integer('shares').defaultTo(0);
    table.integer('impressions').defaultTo(0);
    table.timestamps(true, true);
    table.index(['user_id', 'status']);
  });

  // Meta follower demographics
  await knex.schema.createTable('meta_follower_demographics', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('account_id').notNullable();
    table.string('age_range');
    table.string('gender');
    table.string('location');
    table.integer('follower_count').defaultTo(0);
    table.float('percentage');
    table.timestamps(true, true);
  });

  // EDM campaigns
  await knex.schema.createTable('edm_campaigns', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('subject').notNullable();
    table.text('content');
    table.json('recipient_list');
    table.string('template_id');
    table.datetime('scheduled_time');
    table.string('status').defaultTo('draft');
    table.datetime('sent_at');
    table.integer('sent_count').defaultTo(0);
    table.integer('opened_count').defaultTo(0);
    table.integer('clicked_count').defaultTo(0);
    table.integer('bounced_count').defaultTo(0);
    table.float('open_rate').defaultTo(0);
    table.float('click_rate').defaultTo(0);
    table.timestamps(true, true);
    table.index(['user_id', 'status']);
  });

  // EDM campaign analytics
  await knex.schema.createTable('edm_campaign_analytics', (table) => {
    table.increments('id').primary();
    table.integer('campaign_id').notNullable().references('id').inTable('edm_campaigns');
    table.enum('event_type', ['open', 'click', 'bounce', 'unsubscribe']);
    table.string('recipient_email');
    table.datetime('timestamp');
    table.json('metadata');
    table.timestamps(true, true);
    table.index(['campaign_id', 'event_type']);
  });

  // EDM subscribers
  await knex.schema.createTable('edm_subscribers', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('email').notNullable();
    table.string('name');
    table.json('tags');
    table.enum('status', ['active', 'inactive', 'unsubscribed']).defaultTo('active');
    table.timestamps(true, true);
    table.unique(['user_id', 'email']);
  });

  // Ad campaigns
  await knex.schema.createTable('ad_campaigns', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('name').notNullable();
    table.enum('platform', ['facebook', 'instagram', 'google', 'tiktok']).notNullable();
    table.float('budget').notNullable();
    table.datetime('start_date');
    table.datetime('end_date');
    table.json('target_audience');
    table.string('status').defaultTo('active');
    table.float('spend').defaultTo(0);
    table.integer('impressions').defaultTo(0);
    table.integer('clicks').defaultTo(0);
    table.integer('conversions').defaultTo(0);
    table.float('revenue').defaultTo(0);
    table.timestamps(true, true);
    table.index(['user_id', 'status']);
  });

  // Ad campaign daily stats
  await knex.schema.createTable('ad_campaign_daily_stats', (table) => {
    table.increments('id').primary();
    table.integer('campaign_id').notNullable().references('id').inTable('ad_campaigns');
    table.date('date').notNullable();
    table.integer('impressions').defaultTo(0);
    table.integer('clicks').defaultTo(0);
    table.float('spend').defaultTo(0);
    table.integer('conversions').defaultTo(0);
    table.float('revenue').defaultTo(0);
    table.timestamps(true, true);
    table.unique(['campaign_id', 'date']);
  });

  // Ad conversion funnel
  await knex.schema.createTable('ad_conversion_funnel', (table) => {
    table.increments('id').primary();
    table.integer('campaign_id').notNullable().references('id').inTable('ad_campaigns');
    table.integer('step').notNullable();
    table.string('step_name');
    table.integer('count').defaultTo(0);
    table.float('conversion_rate').defaultTo(0);
    table.timestamps(true, true);
  });

  // Ad audience demographics
  await knex.schema.createTable('ad_audience_demographics', (table) => {
    table.increments('id').primary();
    table.integer('campaign_id').notNullable().references('id').inTable('ad_campaigns');
    table.string('segment').notNullable();
    table.string('segment_value');
    table.integer('count').defaultTo(0);
    table.float('percentage').defaultTo(0);
    table.timestamps(true, true);
  });

  // Ad audience interests
  await knex.schema.createTable('ad_audience_interests', (table) => {
    table.increments('id').primary();
    table.integer('campaign_id').notNullable().references('id').inTable('ad_campaigns');
    table.string('interest').notNullable();
    table.float('interest_score').defaultTo(0);
    table.integer('count').defaultTo(0);
    table.timestamps(true, true);
  });

  // Reports
  await knex.schema.createTable('reports', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.enum('type', ['monthly', 'weekly', 'custom']).notNullable();
    table.string('period').notNullable();
    table.json('data');
    table.timestamps(true, true);
    table.index(['user_id', 'period']);
  });

  // Scheduled reports
  await knex.schema.createTable('scheduled_reports', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.enum('frequency', ['daily', 'weekly', 'monthly']).notNullable();
    table.enum('report_type', ['monthly', 'weekly', 'custom']).notNullable();
    table.string('recipient_email').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.datetime('last_sent_at');
    table.timestamps(true, true);
  });

  // Activity logs
  await knex.schema.createTable('activity_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('action').notNullable();
    table.json('details');
    table.timestamps(true, true);
    table.index(['user_id', 'created_at']);
  });

  // UTM links
  await knex.schema.createTable('utm_links', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('base_url').notNullable();
    table.text('utm_link').notNullable();
    table.string('utm_source').notNullable();
    table.string('utm_medium').notNullable();
    table.string('utm_campaign').notNullable();
    table.string('utm_content');
    table.string('utm_term');
    table.integer('clicks').defaultTo(0);
    table.timestamps(true, true);
    table.index(['user_id', 'utm_campaign']);
  });

  // UTM click events
  await knex.schema.createTable('utm_click_events', (table) => {
    table.increments('id').primary();
    table.integer('utm_link_id').notNullable().references('id').inTable('utm_links');
    table.string('referrer');
    table.string('user_agent');
    table.datetime('timestamp');
    table.timestamps(true, true);
  });

  // LinkedIn accounts
  await knex.schema.createTable('linkedin_accounts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('profile_id').notNullable();
    table.string('access_token').notNullable();
    table.string('profile_name');
    table.timestamps(true, true);
    table.unique(['user_id', 'profile_id']);
  });

  // LinkedIn posts
  await knex.schema.createTable('linkedin_posts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.integer('profile_id').notNullable().references('id').inTable('linkedin_accounts');
    table.text('content');
    table.string('media_url');
    table.datetime('scheduled_time');
    table.string('status').defaultTo('draft');
    table.datetime('published_at');
    table.integer('likes').defaultTo(0);
    table.integer('comments').defaultTo(0);
    table.integer('shares').defaultTo(0);
    table.timestamps(true, true);
    table.index(['user_id', 'status']);
  });

  // MailerLite accounts
  await knex.schema.createTable('mailerlite_accounts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('api_key').notNullable();
    table.timestamps(true, true);
    table.unique(['user_id']);
  });

  // MailerLite campaigns
  await knex.schema.createTable('mailerlite_campaigns', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.string('campaign_id').notNullable();
    table.string('subject').notNullable();
    table.integer('group_id').notNullable();
    table.string('status').defaultTo('draft');
    table.datetime('scheduled_for');
    table.datetime('sent_at');
    table.integer('sent_count').defaultTo(0);
    table.integer('opened_count').defaultTo(0);
    table.integer('clicked_count').defaultTo(0);
    table.timestamps(true, true);
    table.index(['user_id', 'status']);
  });

  // Content schedule
  await knex.schema.createTable('content_schedules', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.enum('platform', ['instagram', 'facebook', 'linkedin', 'newsletter']);
    table.enum('content_type', ['post', 'story', 'reel', 'carousel']);
    table.enum('frequency', ['daily', 'weekly', '72-hourly', 'monthly']);
    table.integer('posts_per_period').notNullable();
    table.json('optimal_times');
    table.boolean('auto_schedule').defaultTo(true);
    table.timestamps(true, true);
    table.index(['user_id', 'platform']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('content_schedules');
  await knex.schema.dropTableIfExists('mailerlite_campaigns');
  await knex.schema.dropTableIfExists('mailerlite_accounts');
  await knex.schema.dropTableIfExists('linkedin_posts');
  await knex.schema.dropTableIfExists('linkedin_accounts');
  await knex.schema.dropTableIfExists('utm_click_events');
  await knex.schema.dropTableIfExists('utm_links');
  await knex.schema.dropTableIfExists('activity_logs');
  await knex.schema.dropTableIfExists('scheduled_reports');
  await knex.schema.dropTableIfExists('reports');
  await knex.schema.dropTableIfExists('ad_audience_interests');
  await knex.schema.dropTableIfExists('ad_audience_demographics');
  await knex.schema.dropTableIfExists('ad_conversion_funnel');
  await knex.schema.dropTableIfExists('ad_campaign_daily_stats');
  await knex.schema.dropTableIfExists('ad_campaigns');
  await knex.schema.dropTableIfExists('edm_subscribers');
  await knex.schema.dropTableIfExists('edm_campaign_analytics');
  await knex.schema.dropTableIfExists('edm_campaigns');
  await knex.schema.dropTableIfExists('meta_follower_demographics');
  await knex.schema.dropTableIfExists('meta_posts');
  await knex.schema.dropTableIfExists('meta_accounts');
  await knex.schema.dropTableIfExists('users');
}
