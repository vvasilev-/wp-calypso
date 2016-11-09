/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { identity } from 'lodash';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import QueryKeyringConnections from 'components/data/query-keyring-connections';
import QueryKeyringServices from 'components/data/query-keyring-services';
import SharingServicesGroup from './services-group';

class SharingConnections extends Component {
	static propTypes = {
		connections: PropTypes.object,
		translate: PropTypes.func,
	};

	static defaultProps = {
		connections: Object.freeze( {} ),
		translate: identity,
	};

	render() {
		return (
			<div className="sharing-settings sharing-connections">
				<QueryKeyringConnections />
				<QueryKeyringServices />
				<SharingServicesGroup type="publicize" title={ this.props.translate( 'Publicize Your Posts' ) } />
				<SharingServicesGroup type="other" title={ this.props.translate( 'Other Connections' ) } />
			</div>
		);
	}
}

export default localize( SharingConnections );
