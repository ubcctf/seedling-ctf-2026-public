require 'sinatra'
require 'liquid'
require 'time'
require_relative 'bot'

ADMIN_USER = 'admin'
ADMIN_PASS = ENV.fetch('ADMIN_PASS') { SecureRandom.hex(16) }

BOT_BACKLOG = 5
BOT_QUEUE = Queue.new

BOT_HITS = {}
BOT_HITS_LOCK = Mutex.new

Thread.new do
  loop do
    url = BOT_QUEUE.pop
    begin
      AdminBot.visit(url, ADMIN_USER, ADMIN_PASS)
    rescue StandardError => e
      warn "[bot] #{e.class}: #{e.message}"
    end
  end
end

enable :sessions
set :session_secret, SecureRandom.hex(32)

helpers do
  def protected!
    halt 401, "Not authorized\n" unless session[:user] == ADMIN_USER
  end


  def sanitize(content)
    sanitized_content = content.delete('<>/\\\\`.')
  end

  def template_from_file(filename)
    content = File.read(filename)
    sanitized_content = sanitize(content)
    Liquid::Template.parse(sanitized_content)
  end


end

get '/racer/:racer' do
  racer = params['racer']
  race = params["race"]
  halt 404, "no such directory\n" if not ["carlos_sainz_jr", "charles_leclerc", "lando_norris", "lewis_hamilton", "max_verstappen"].include?(racer)
  halt 404, "no such report\n" if race.to_s.match?(%r{\.\.|[/\\]})
  template = template_from_file("./racers/%s/%s" % [racer, race])
  template.render('date' => Time.now.strftime('%F'))
end

get '/get_races' do
    content_type 'text/plain'
    begin
        racer = "./racers/%s" % [params['racer']]
        Dir.children(racer.to_s).sort.join("\n") + "\n"
    rescue SystemCallError
        halt 404, "no such directory\n"
    end
end

post '/login' do
    if params['username'] == ADMIN_USER && params['password'] == ADMIN_PASS
        session[:user] = ADMIN_USER
        "logged in\n"
    else
        halt 401, "Bad credentials\n"
    end
end

post '/logout' do
    session.clear
    "logged out\n"
end

post '/report' do
    halt 429, "bot is busy, try again later\n" if BOT_QUEUE.size >= BOT_BACKLOG

    request.body.rewind
    data = Rack::Utils.parse_nested_query(request.body.read)

    url = AdminBot.same_origin_url(data['url'])
    halt 400, "url must be a link on this site\n" if url.nil?

    BOT_QUEUE << url
    "the admin will review the report shortly\n"
end

get '/admin/analysis' do
    protected!
    begin 
      puts "admin visit"
      template = template_from_file("./racers/%s" % [params[:file]])
      puts "./racers/%s" % [params[:file]]
      template.render('date' => Time.now.strftime('%F'))
    rescue => e
      halt 500, "server error!"
    end
end
