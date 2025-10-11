class ImportPremiumNamesJob
  include Sidekiq::Job

  def perform
    ImportNames.call
  end
end
