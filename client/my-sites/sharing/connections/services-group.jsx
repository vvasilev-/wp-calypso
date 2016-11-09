/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { times } from 'lodash';

/**
 * Internal dependencies
 */
import { getEligibleKeyringServices } from 'state/sharing/services/selectors';
import { getSelectedSiteId } from 'state/ui/selectors';
import SectionHeader from 'components/section-header';
import Service from './service';
import ServicePlaceholder from './service-placeholder';

/**
 * Module constants
 */
const NUMBER_OF_PLACEHOLDERS = 4;

class SharingServicesGroup extends Component {
	static propTypes = {
		services: PropTypes.array,
		title: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
	};

	static defaultProps = {
		services: Object.freeze( [] ),
	};

	render() {
		return (
			<div className="sharing-services-group">
				<SectionHeader label={ this.props.title } />
				<ul className="sharing-services-group__services">
					{ this.props.services.length
						? this.props.services.map( ( service ) =>
							<Service key={ service.ID } service={ service } /> )
						: times( NUMBER_OF_PLACEHOLDERS, ( index ) =>
							<ServicePlaceholder key={ 'service-placeholder-' + index } /> )
					}
				</ul>
			</div>
		);
	}
}

export default connect(
	( state, { type } ) => ( {
		services: getEligibleKeyringServices( state, getSelectedSiteId( state ), type )
	} ),
)( SharingServicesGroup );
