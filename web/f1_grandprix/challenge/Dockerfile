FROM ruby:3.4-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
 && rm -rf /var/lib/apt/lists/*

ENV BUNDLE_PATH=/gems \
    BUNDLE_FROZEN=1 \
    BUNDLE_WITHOUT=development:test

WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install && rm -rf /gems/ruby/*/cache

FROM ruby:3.4-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium chromium-driver \
 && rm -rf /var/lib/apt/lists/*

ENV BUNDLE_PATH=/gems \
    BUNDLE_FROZEN=1 \
    BUNDLE_WITHOUT=development:test \
    RACK_ENV=production \
    HOME=/tmp \
    CHROME_BIN=/usr/lib/chromium/chromium \
    CHROMEDRIVER_BIN=/usr/bin/chromedriver

COPY --from=builder /gems /gems

WORKDIR /app
COPY app.rb /app/
COPY bot.rb /app/
COPY Gemfile /app/
COPY Gemfile.lock /app/
COPY racers/ /app/racers

RUN mkdir -p racers

EXPOSE 4567
CMD ["bundle", "exec", "ruby", "app.rb", "-o", "0.0.0.0", "-p", "4567"]
