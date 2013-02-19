module ApplicationHelper

	#returns the full title on a per-page basis, will provide a base title without '|' divider in the case that no page title is provided
	def full_title(page_title)
		base_title = "Muse"
		if page_title.empty?
			base_title
		else
			"#{base_title} | #{page_title}"
		end
	end
end
