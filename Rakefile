require 'rake'
require 'rake/rdoctask'
require 'rubygems'
require 'spec/rake/spectask'

desc 'Generate documentation for the unobtrusive_date_time_picker plugin.'
Rake::RDocTask.new(:rdoc) do |rdoc|
   rdoc.rdoc_dir = 'rdoc'
   rdoc.title    = 'Unobtrusive DateTime-Picker'
   rdoc.options << '--line-numbers' << '--inline-source'
   rdoc.rdoc_files.add ['lib/**/*.rb', 'README']
   rdoc.options << '--main' << 'README'
end

desc "Run all specs"
Spec::Rake::SpecTask.new do |t|
  t.spec_opts = ['--options', 'spec/spec.opts']
end
