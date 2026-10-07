require 'selenium-webdriver'
require 'tmpdir'
require 'uri'

module AdminBot
  BASE_URL   = ENV.fetch('BOT_BASE_URL', 'http://127.0.0.1:4567')
  CHROME_BIN = '/usr/lib/chromium/chromium'
  DRIVER_BIN =  '/usr/bin/chromedriver'
  FLAG       = ENV.fetch('FLAG', 'maple{placeholder_flag}')
  DWELL      = 3
  TIMEOUT    = 20

  def self.same_origin_url(value)
    target = value.to_s.strip
    return nil if target.empty?

    base = URI.parse(BASE_URL)
    url  = base.merge(target)
    return nil unless url.is_a?(URI::HTTP)
    return nil unless [url.scheme, url.host, url.port] == [base.scheme, base.host, base.port]

    url.to_s
  rescue URI::Error
    nil
  end

  def self.visit(url, user, pass)
    Dir.mktmpdir('bot-profile') do |profile|
      driver = new_driver(profile)
      begin
        driver.navigate.to("#{BASE_URL}/")
        set_flag_cookie(driver)
        login(driver, user, pass)
        puts "Logged in. visiting:"
        puts url
        driver.navigate.to(url)
        puts "visited"
        sleep DWELL
      ensure
        begin
          driver.quit
        rescue StandardError
          nil
        end
      end
    end
  end

  def self.set_flag_cookie(driver)
    driver.manage.add_cookie(name: 'flag', value: FLAG, path: '/', http_only: false, same_site: 'Strict')
  end

  def self.new_driver(profile)
    options = Selenium::WebDriver::Chrome::Options.new(binary: CHROME_BIN)
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1280,1024')
    options.add_argument('--enable-logging=stderr')
    options.add_argument('--v=1')
    options.add_argument("--user-data-dir=#{profile}")

    service = Selenium::WebDriver::Chrome::Service.new(path: DRIVER_BIN)
    service.args << '--verbose'
    service.args << '--log-path=/tmp/chromedriver.log'

    driver = Selenium::WebDriver.for(:chrome, options: options, service: service)
    driver.manage.timeouts.page_load = TIMEOUT
    driver.manage.timeouts.script = TIMEOUT
    driver
  end

  def self.login(driver, user, pass)
    status = driver.execute_async_script(<<~JS, user, pass)
      const [user, pass, done] = arguments;
      fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: user, password: pass }).toString(),
        credentials: 'same-origin'
      }).then(r => done(r.status)).catch(e => done(String(e)));
    JS

    raise "admin login failed (#{status})" unless status == 200
  end
end
