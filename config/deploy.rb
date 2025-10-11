# config valid for current version and patch releases of Capistrano
lock "~> 3.19.2"

set :application, "auction-app"
set :repo_url, "git@github.com:bencryption66/auction-app.git"
# Also works with non-github repos, I roll my own gitolite server
set :deploy_to, "/home/deploy/#{fetch :application}"
set :rbenv_prefix, '/usr/bin/rbenv exec' # Cf issue: https://github.com/capistrano/rbenv/iss

set :puma_threads,    [4, 16]
set :puma_workers,    0

append :linked_dirs, 'log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'vendor/bundle', '.bundle', 'public/system', 'public/uploads'

namespace :secrets do
  desc 'Load the secrets'
  task :load do # |t, args|
    on roles(:all) do
      execute "source $HOME/.auction-secrets"
    end
  end

  desc 'Replace database.yml'
  task :replace_db_config do # |t, args|
    on roles(:db) do
      execute "rm #{fetch :release_path}/config/database.yml && ln -s /home/deploy/config/auction-database.yml #{fetch :release_path}/config/database.yml"
    end
  end
end

namespace :debug do
  desc 'Print ENV variables'
  task :env do
    on roles(:app), in: :sequence, wait: 5 do
      execute :printenv
    end
  end
end

namespace :puma do
  desc 'Create Directories for Puma Pids and Socket'
  task :make_dirs do
    on roles(:app) do
      execute "mkdir #{shared_path}/tmp/sockets -p"
      execute "mkdir #{shared_path}/tmp/pids -p"
    end
  end

  before 'deploy:starting', 'puma:make_dirs'
end

namespace :deploy do
  desc "Make sure local git is in sync with remote."
  task :check_revision do
    on roles(:app) do

      # Update this to your branch name: master, main, etc. Here it's main
      unless `git rev-parse HEAD` == `git rev-parse origin/main`
        puts "WARNING: HEAD is not the same as origin/main"
        puts "Run `git push` to sync changes."
        exit
      end
    end
  end

  desc 'Initial Deploy'
  task :initial do
    on roles(:app) do
      before 'deploy:restart', 'puma:start'
      invoke 'deploy'
    end
  end

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      invoke 'puma:restart'
    end
  end

  before :starting,     :check_revision
  after  :finishing,    :compile_assets
  after  :finishing,    :cleanup
end

before 'deploy:check:directories', 'secrets:load'
before 'deploy:assets:precompile', 'secrets:replace_db_config'

