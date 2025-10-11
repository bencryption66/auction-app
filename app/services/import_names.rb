class ImportNames
  include Callable

  ENS_WRAPPER_ADDRESS = '0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401'.freeze
  ENS_CONTRACT_ADDRESS = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85'.freeze

  def call
    page = 1
    loop do
      puts "Fetching page #{page}"
      domains = EnsGraph::GetPremiumDomains.new.call(page: page)
      break if domains.empty?

      domains.each do |domain_data|
        import_name(domain_data)
      end

      page += 1
    end
  rescue StandardError => e
    puts "Error occurred: #{e.message}"
  end

  def wrapped_ens_collection
    @wrapped_ens_collection ||= Collection.find_or_create_by!(name: 'Wrapped ENS', contract_address: ENS_WRAPPER_ADDRESS)
  end

  def ens_collection
    @ens_collection ||= Collection.find_or_create_by!(name: 'ENS', contract_address: ENS_CONTRACT_ADDRESS)
  end

  def wrapped?(data)
    data['registrant']['id'].downcase == ENS_WRAPPER_ADDRESS.downcase
  end

  def import_name(data)
    domain_name = data['domain']['name']
    registrant_id = data['registrant']['id']
    expiry_date = Time.at(data['expiryDate'].to_i)
    registration_date = Time.at(data['registrationDate'].to_i)

    asset = Asset.find_or_initialize_by(name: domain_name)
    asset.expires_at = expiry_date
    asset.registered_at = registration_date
    asset.collection = wrapped?(data) ? wrapped_ens_collection : ens_collection
    asset.save!

    Categorizer.new(asset).call

    puts "Imported/Updated domain: #{domain_name}, expires at: #{expiry_date}, registrant: #{registrant_id}"
  rescue StandardError => e
    puts "Error importing domain #{domain_name}: #{e.message}"
  end
end
